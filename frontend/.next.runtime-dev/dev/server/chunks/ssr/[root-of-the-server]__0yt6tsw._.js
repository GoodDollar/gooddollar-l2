module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/useTransactions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useTransactions",
    ()=>useTransactions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
const STORAGE_KEY = 'goodswap-transactions';
const MAX_TRANSACTIONS = 20;
function loadTransactions() {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
}
function saveTransactions(txs) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function useTransactions() {
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setTransactions(loadTransactions());
    }, []);
    const addTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((tx)=>{
        const newTx = {
            ...tx,
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now()
        };
        setTransactions((prev)=>{
            const next = [
                newTx,
                ...prev
            ].slice(0, MAX_TRANSACTIONS);
            saveTransactions(next);
            return next;
        });
        return newTx.id;
    }, []);
    const updateStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, status)=>{
        setTransactions((prev)=>{
            const next = prev.map((tx)=>tx.id === id ? {
                    ...tx,
                    status
                } : tx);
            saveTransactions(next);
            return next;
        });
    }, []);
    const clearAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setTransactions([]);
        saveTransactions([]);
    }, []);
    const pendingCount = transactions.filter((tx)=>tx.status === 'pending').length;
    return {
        transactions,
        addTransaction,
        updateStatus,
        clearAll,
        pendingCount
    };
}
}),
"[project]/frontend/src/lib/TransactionContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TransactionProvider",
    ()=>TransactionProvider,
    "useTransactionContext",
    ()=>useTransactionContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useTransactions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useTransactions.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const TransactionContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function TransactionProvider({ children }) {
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useTransactions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransactions"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TransactionContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/lib/TransactionContext.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
function useTransactionContext() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(TransactionContext);
    if (!ctx) throw new Error('useTransactionContext must be used inside TransactionProvider');
    return ctx;
}
}),
"[project]/frontend/src/components/ThemeProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
'use client';
;
;
function ThemeProvider({ children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ThemeProvider.tsx",
        lineNumber: 7,
        columnNumber: 10
    }, this);
}
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/op-stack/addresses.json.[json].cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "_comment": "GoodDollar L2 contract addresses — synced 2026-05-23 09:33:39 from scripts/refresh-addresses.py (chain_id=42069, rpc=http://localhost:8545). DO NOT hand-edit; re-run the script after every redeploy.",
    "chain_id": 42069,
    "chain_name": "GoodDollar L2 Devnet",
    "rpc_url": "https://rpc.goodclaw.org",
    "explorer_url": "https://explorer.goodclaw.org",
    "contracts": {
        "GoodDollarToken": "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        "UBIClaimV2": "0x3904b8f5b0f49cd206b7d5aabee5d1f37ee15d8d",
        "UBIFeeSplitter": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        "LiFiBridgeAggregator": "0x2625760c4a8e8101801d3a48ee64b2bea42f1e96",
        "ValidatorStaking": "0xa56f946d6398dd7d9d4d9b337cf9e0f68982ca5b",
        "UBIFeeHook": "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
        "FundingRate": "0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2",
        "MarginVault": "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43",
        "PerpPriceOracle": "0x21df544947ba3e8b3c32561399e88b52dc8b2823",
        "PerpEngine": "0xdc11f7e700a4c898ae5caddb1082cffa76512add",
        "ConditionalTokens": "0x8c8e61e4705d1dbee6deadb39e67ac77650b0704",
        "MarketFactory": "0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d",
        "AgentRegistry": "0x0165878a594ca255338adfa4d48449f69242eb8f",
        "StocksPriceOracle": "0xa4899d35897033b927acfcf422bc745916139776",
        "CollateralVault": "0x34b40ba116d5dec75548a9e9a8f15411461e8c70",
        "CollateralVault_WRONG_GDT": "0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5",
        "SyntheticAssetFactory": "0xc96304e3c037f81da488ed9dea1d8f2a48278a75",
        "VoteEscrowedGD": "0x202cce504e04bed6fc0521238ddf04bc9e8e15ab",
        "GoodDAO": "0xf4b146fba71f41e0592668ffbf264f1d186b2ca8",
        "GoodLendPool": "0x809d550fca64d94bd9f66e60752a544199cfac3d",
        "GoodSwapRouter": "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
        "SwapPriceOracle": "0xc7143d5ba86553c06f5730c8dc9f8187a621a8d4",
        "FastWithdrawalLP": "0xefab0beb0a557e452b398035ea964948c750b2fd",
        "VaultManager": "0x1780bcf4103d3f501463ad3414c7f4b654bb7afd",
        "VaultFactory": "0xd6e1afe5ca8d00a2efc01b89997abe2de47fdfaf",
        "PegStabilityModule": "0x12bcb546bc60ff39f1adfc7ce4605d5bd6a6a876",
        "StabilityPool": "0x5133bbdfcca3eb4f739d599ee4ec45cbcd0e16c5",
        "gUSD": "0x413b1afca96a3df5a686d8bfbf93d30688a7f7d9",
        "MockWETH": "0x4826533b4897376654bb4d4ad88b7fafd0c98528",
        "MockUSDC": "0x70e0ba845a1a0f2da3359c97e0285013525ffc49",
        "CollateralRegistry": "0x821f3361d454cc98b7555221a06be563a7e2e0a6",
        "GoodLendToken": "0x4c5859f0f772848b2d91f1d83e2fe57935348029",
        "UBIRevenueTracker": "0x99dbe4aea58e518c50a1c04ae9b48c9f6354612f",
        "StockOracleV2": "0xa6e99a4ed7498b3cddcbb61a6a607a4925faa1b7",
        "StockOracleV2Adapter": "0x5302e909d1e93e30f05b5d6eea766363d14f9892",
        "PriceOracle": "0xa4899d35897033b927acfcf422bc745916139776"
    },
    "admin": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "sequencer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "batcher": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "proposer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
};
}),
"[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONTRACTS",
    ()=>CONTRACTS,
    "DEVNET_CHAIN_ID",
    ()=>DEVNET_CHAIN_ID,
    "DEVNET_CONTRACTS",
    ()=>DEVNET_CONTRACTS,
    "DEVNET_EXPLORER_URL",
    ()=>DEVNET_EXPLORER_URL,
    "DEVNET_RPC_URL",
    ()=>DEVNET_RPC_URL
]);
/**
 * Devnet configuration — single source of truth for contract addresses, RPC
 * URL, chain ID, and ABIs.
 *
 * Addresses are sourced from `op-stack/addresses.json`, which is regenerated
 * from `broadcast/` artifacts by `scripts/refresh-addresses.py` after every
 * redeploy. The script also writes `.autobuilder/addresses.env` so the
 * canonical address set is identical for backend services, cast scripts, and
 * the frontend.
 *
 * Anything still hardcoded below is a contract that the refresh script does
 * NOT track yet (typically pool tokens, sToken ERC-20s, mock collateral) —
 * those need to be either added to `SYMBOL_MAP` in the refresh script or
 * redeployed in a follow-up task. Dead-on-chain hardcoded addresses are
 * tagged with `// STALE` so they are easy to find and remediate.
 *
 * All frontend data modules should import addresses and ABIs from this module
 * instead of hardcoding values or importing from chain.ts directly.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/op-stack/addresses.json.[json].cjs [app-ssr] (ecmascript)");
;
const DEVNET_CHAIN_ID = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].chain_id;
const DEVNET_RPC_URL = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].rpc_url;
const DEVNET_EXPLORER_URL = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].explorer_url;
const CONTRACTS = {
    // ── Core (from op-stack/addresses.json) ──────────────────────────────────
    GoodDollarToken: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.GoodDollarToken,
    UBIClaimV2: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.UBIClaimV2,
    UBIFeeSplitter: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.UBIFeeSplitter,
    LiFiBridgeAggregator: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.LiFiBridgeAggregator,
    ValidatorStaking: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.ValidatorStaking,
    UBIFeeHook: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.UBIFeeHook,
    MarketFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.MarketFactory,
    // ConditionalTokens: in JSON but currently no code on-chain after re-snapshot;
    // surfaced via JSON so the next refresh-addresses run picks up a redeploy.
    ConditionalTokens: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.ConditionalTokens,
    OptimisticResolver: "0x7c8baafa542c57ff9b2b90612bf8ab9e86e22c09",
    // ── GoodLend — sourced from op-stack/addresses.json (chain 42069) ────────
    // Previous hardcoded GoodLendPool (0x49fd…) was wiped by chain re-snapshot.
    GoodLendPool: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.GoodLendPool,
    GoodLendPriceOracle: "0x9d4454b023096f34b160d6b654540c56a1f81688",
    GoodLendInterestRateModel: "0x809d550fca64d94bd9f66e60752a544199cfac3d",
    // GoodLend reserve tokens — JSON-tracked
    MockUSDC: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.MockUSDC,
    MockWETH: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.MockWETH,
    // gTokens (interest-bearing) — STALE: not in JSON, no code on-chain — needs redeploy task
    gUSDC: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
    gWETH: "0x82e01223d51eb87e16a03e24687edf0f294da6f1",
    // Debt tokens — STALE: not in JSON, no code on-chain — needs redeploy task
    debtUSDC: "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90",
    debtWETH: "0x2bdcc0de6be1f7d2ee689a0342d76f52e8efaba3",
    // ── GoodSwap — re-seeded to devnet (chain 42069), 2026-05-15 (Task 0011) ──
    // Router, pools, and pool tokens were re-seeded after the 2026-05-18 devnet reset.
    PoolManager: "0xC9a43158891282A2B1475592D5719c001986Aaec",
    GoodSwapRouter: "0xa6e99a4ed7498b3cddcbb61a6a607a4925faa1b7",
    // GoodSwap Liquidity Pools (verified alive)
    SwapPoolGdWeth: "0x6f6f570f45833e249e27022648a26f4076f48f78",
    SwapPoolGdUsdc: "0xca8c8688914e0f7096c920146cd0ad85cd7ae8b9",
    SwapPoolWethUsdc: "0xb0f05d25e41fbc2b52013099ed9616f1206ae21b",
    // GoodSwap pool tokens — deployed by DeploySwapInfra after reset.
    SwapGD: "0xb9beecd1a582768711de1ee7b0a1d582d9d72a6c",
    SwapWETH: "0x8a93d247134d91e0de6f96547cb0204e5be8e5d8",
    SwapUSDC: "0x40918ba7f132e0acba2ce4de4c4baf9bd2d7d849",
    // ── GoodPerps — sourced from op-stack/addresses.json (chain 42069) ───────
    // Previous hardcoded PerpEngine address (0x021DBfF4…) collided with the
    // legacy UBIRevenueTracker slot and had no code on-chain.
    PerpEngine: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.PerpEngine,
    MarginVault: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.MarginVault,
    FundingRate: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.FundingRate,
    PerpPriceOracle: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.PerpPriceOracle,
    // ── GoodStocks — sourced from op-stack/addresses.json (chain 42069) ──────
    // CollateralVault and SyntheticAssetFactory now live in the JSON; only the
    // sToken ERC-20s are still hardcoded and need a redeploy.
    StocksPriceOracle: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.StocksPriceOracle,
    CollateralVault: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.CollateralVault,
    SyntheticAssetFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.SyntheticAssetFactory,
    // Synthetic stock tokens (sToken ERC-20s) — live after reset
    sAAPL: "0x4a46860E025D02f60Bff5f44afB25ed75298784C",
    sTSLA: "0x4565072738662672Bb9B1b1b5CF015C4b05A9328",
    sNVDA: "0x873B05552B084BB737107ED762C36e2eB64b4cDe",
    sMSFT: "0xC1F24d2C4C30A6DD19277EfB3771e724889eaa5f",
    sAMZN: "0x0d3AA1Ff33792CD98b966846B0F661276E8eA4e1",
    sGOOGL: "0xd6A7D966Ea6eDeA76330eA64A773318148E8F02D",
    sMETA: "0xA0A6e9950d626A1f4F707a82BdE6e48ACFc2FF82",
    sJPM: "0x6bA870E970f80cD9F7bD3E23EEd8b3Ed042728Cf",
    sV: "0x7921b17aBf22438a597b3c02017ab6E524fe8521",
    sDIS: "0x00029cf217b9b1696A51d2145386f601d56D425f",
    sNFLX: "0xa27e40C9393FeD9E92CbFC42127519155484f89C",
    sAMD: "0xe320Ed42E8FFbFd8efd219bC35fe0F66c5773890",
    // ── Governance — sourced from op-stack/addresses.json ────────────────────
    VoteEscrowedGD: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.VoteEscrowedGD,
    GoodDAO: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.GoodDAO,
    GoodTimelock: "0x5e6cb7e728e1c320855587e1d9c6f7972ebdd6d5",
    // ── GoodStable — sourced from op-stack/addresses.json (chain 42069) ──────
    // Previous hardcoded addresses (gUSD 0x5D42…, VaultManager 0xAb7b…, etc.)
    // were wiped by chain re-snapshot.
    gUSD: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.gUSD,
    VaultManager: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.VaultManager,
    CollateralRegistry: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.CollateralRegistry,
    StabilityPool: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.StabilityPool,
    PegStabilityModule: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.PegStabilityModule,
    StablePriceOracle: "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab",
    StableFeeSplitter: "0x26b862f640357268bd2d9e95bc81553a2aa81d7e",
    // GoodStable collateral tokens (separate from GoodLend mocks) — live after reset
    StableMockWETH: "0xb2b580ce436e6f77a5713d80887e14788ef49c9a",
    StableMockUSDC: "0xb377a2eed7566ac9fcb0ba673604f9bf875e2bab",
    StableMockGD: "0x66f625b8c4c635af8b74ece2d7ed0d58b4af3c3d",
    // ── UBI Analytics — sourced from op-stack/addresses.json ─────────────────
    // Previous hardcoded UBIRevenueTracker (0x021DBfF4…) was actually the OLD
    // PerpEngine address — wrong contract entirely. Now wired to the canonical
    // 0xfd6f… deployed alongside the current revenue/UBI splitter pair.
    UBIRevenueTracker: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.UBIRevenueTracker,
    // ── GoodYield — sourced from op-stack/addresses.json (chain 42069) ───────
    VaultFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.VaultFactory,
    // ── GoodYield Initial Vaults — live after reset ──
    ETHLendingVault: "0xE5b9c837CF35ad00937CE3B553A1F13807EAC8f4",
    GUSDStabilityVault: "0xa327526e816a9f9958C2C1A936BEcC4675CACC4b",
    GDLendingVault: "0x8dB9B84E12FF48cC14B5ECE688e95A0597fA42B8",
    // ── Agent Registry — sourced from op-stack/addresses.json ────────────────
    AgentRegistry: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].contracts.AgentRegistry,
    // ── QA TestRegistry — live after reset ───────────────────────────────────
    TestRegistry: "0x0a17fabea4633ce714f1fa4a2dca62c3bac4758d"
};
const DEVNET_CONTRACTS = CONTRACTS;
;
}),
"[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gooddollarL2",
    ()=>gooddollarL2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$chain$2f$defineChain$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/chain/defineChain.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
;
;
const gooddollarL2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$chain$2f$defineChain$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defineChain"])({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_CHAIN_ID"],
    name: 'GoodDollar L2',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH'
    },
    rpcUrls: {
        default: {
            http: [
                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_RPC_URL"]
            ]
        }
    },
    blockExplorers: {
        default: {
            name: 'Blockscout',
            url: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_EXPLORER_URL"]
        }
    },
    // Do not advertise Multicall3 here unless the devnet actually has code at
    // the canonical address. After the latest reset, 0xcA11… returns empty code;
    // wagmi/viem then routes `useReadContracts` through a dead multicall and all
    // reads resolve as `0x`. Omitting the entry lets wagmi fall back to direct
    // eth_call reads, which keeps E2E/devnet pages functional.
    testnet: true
});
;
}),
"[project]/frontend/src/lib/wagmi-helpers.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Pure helpers extracted from wagmi.ts so they can be unit-tested
// without pulling in @rainbow-me/rainbowkit (whose getDefaultConfig
// throws synchronously on an empty projectId and is therefore not
// safe to load in vitest).
// WalletConnect Cloud project IDs are 32-char hex strings.
// See https://cloud.walletconnect.com — IDs are issued in the
// admin dashboard and are lowercase hex; we accept both cases
// defensively. Anything else (empty, placeholder like
// "goodswap-dev", short string, dashes) is treated as unset so
// that callers can decide to skip mobile-wallet flows or emit
// a clear boot-time error.
__turbopack_context__.s([
    "WC_PROJECT_ID_RE",
    ()=>WC_PROJECT_ID_RE,
    "validateWcProjectId",
    ()=>validateWcProjectId
]);
const WC_PROJECT_ID_RE = /^[a-f0-9]{32}$/i;
function validateWcProjectId(raw) {
    if (typeof raw !== 'string') return '';
    return WC_PROJECT_ID_RE.test(raw) ? raw : '';
}
}),
"[project]/frontend/src/lib/walletConnectConfig.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWalletConnectConfigured",
    ()=>isWalletConnectConfigured,
    "validatedWcProjectId",
    ()=>validatedWcProjectId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2d$helpers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/wagmi-helpers.ts [app-ssr] (ecmascript)");
;
const rawWcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const validatedWcProjectId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2d$helpers$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateWcProjectId"])(rawWcProjectId);
const isWalletConnectConfigured = validatedWcProjectId !== '';
}),
"[project]/frontend/src/lib/wagmi.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$ATF7WNUQ$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/wallets/walletConnectors/chunk-ATF7WNUQ.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$RTDGOYZC$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/wallets/walletConnectors/chunk-RTDGOYZC.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$XB3GM6SJ$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/wallets/walletConnectors/chunk-XB3GM6SJ.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$createConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@wagmi/core/dist/esm/createConfig.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$http$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/clients/transports/http.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$walletConnectConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/walletConnectConfig.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const isValidWcProjectId = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$walletConnectConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWalletConnectConfigured"];
// Scoped console filter for Reown / WalletConnect noise.
//
// Installed on BOTH branches of the config selection below:
//
//   - Valid projectId branch (production today): RainbowKit's
//     getDefaultConfig wires the WalletConnect connector, which
//     imports @reown/appkit-core. On page load that SDK fetches
//     remote project config from api.web3modal.org. If the
//     current page origin is not on the project's Cloud allowlist
//     the request returns HTTP 403 and the SDK logs:
//       console.error "Origin <origin> not found on Allowlist - update
//                      configuration on cloud.reown.com"
//       console.warn  "[Reown Config] Failed to fetch remote project
//                      configuration. Using local/default values."
//     Wallet connectivity itself still works (the SDK falls back
//     to local defaults), so this is a polish/noise fix, not a
//     functional regression. The permanent fix is to add the
//     origin to the project's allowlist in https://cloud.reown.com
//     — see docs/TESTNET_README.md "Operator runbook → WalletConnect
//     / Reown Cloud allowlist".
//
//   - Invalid projectId branch: kept as a defensive safety net.
//     In normal operation buildNoWcConfig() avoids importing
//     @reown/appkit entirely, so the filter is unreachable there;
//     but a future RainbowKit / wagmi version that reintroduces a
//     WC code path through a non-WC connector factory would still
//     be silenced.
//
// The filter is intentionally narrow: it matches two exact log
// patterns and lets every other warn/error pass through unchanged.
// Idempotency is guarded by a flag on `window` so re-importing
// wagmi.ts (e.g. in tests with vi.resetModules) does not wrap the
// console methods on top of themselves.
function installReownConsoleFilter() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const w = undefined;
    // "[Reown Config] Failed to fetch remote project configuration" —
    // the warning shape from @reown/appkit's remote config fetch.
    const reownConfigRe = undefined;
    // "Origin ... not found on Allowlist - update configuration on cloud.reown.com" —
    // the allowlist-403 error. Anchored on `cloud.reown.com` so it
    // cannot match an unrelated console.error from another component.
    const reownAllowlistRe = undefined;
    const originalWarn = undefined;
    const originalError = undefined;
}
installReownConsoleFilter();
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
;
// HTTP transport shared by both config branches. JSON-RPC batching at
// the transport layer coalesces requests inside a small time window
// into a single batched POST, complementing Multicall3 (wired in
// ./chain.ts) by also collapsing reads that don't go through
// `useReadContracts` (raw `useReadContract`, `getBlockNumber`, ENS
// lookups, balance reads). See task 0059.
const transports = {
    [__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["gooddollarL2"].id]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$http$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"])('/api/rpc', {
        batch: true
    })
};
// Branch on whether we have a real, 32-char-hex WalletConnect project
// ID. When valid, we use RainbowKit's `getDefaultConfig`, which wires
// the WalletConnect connector and the full default wallet list (mobile
// QR flows work). When invalid (env unset or any sentinel like
// `gooddollar-placeholder`), we skip `getDefaultConfig` entirely so the
// WalletConnect / `@reown/appkit-core` SDK is never imported and
// therefore never fires HTTPS requests to `api.web3modal.org` or
// `pulse.walletconnect.org` on page load. See task 0095 for the perf /
// privacy rationale.
//
// Connectors selected for the no-WC branch are extension-only and do
// not transitively reach `getWalletConnectConnector`:
//   - injectedWallet: surfaces window.ethereum (MetaMask, Brave,
//     Rabby, etc.) without any WC fallback.
//   - coinbaseWallet: uses @coinbase/wallet-sdk directly.
//   - safeWallet: uses wagmi's `safe` connector; only active inside
//     Safe{Apps} iframes, no WC code path.
// `metaMaskWallet` and `rainbowWallet` are intentionally excluded
// because their factories fall back to `getWalletConnectConnector`
// when the corresponding browser extension is not detected (and in
// SSR/jsdom environments `window.ethereum` is always undefined),
// which would re-introduce the network requests we are trying to
// eliminate. Users with MetaMask installed still connect through
// `injectedWallet`.
function buildNoWcConfig() {
    const connectors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["connectorsForWallets"])([
        {
            groupName: 'Browser Wallets',
            wallets: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$RTDGOYZC$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["injectedWallet"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$ATF7WNUQ$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["coinbaseWallet"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$wallets$2f$walletConnectors$2f$chunk$2d$XB3GM6SJ$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeWallet"]
            ]
        }
    ], {
        appName: 'GoodDollar',
        // `connectorsForWallets` requires a non-empty `projectId` string
        // but none of the wallets above read it. Pass a sentinel that
        // clearly signals "WalletConnect is intentionally disabled" if
        // it ever surfaces in a debugger.
        projectId: 'gooddollar-no-wc'
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$createConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createConfig"])({
        chains: [
            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["gooddollarL2"]
        ],
        connectors,
        ssr: true,
        transports
    });
}
const config = isValidWcProjectId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDefaultConfig"])({
    appName: 'GoodDollar',
    projectId: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$walletConnectConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validatedWcProjectId"],
    chains: [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["gooddollarL2"]
    ],
    ssr: true,
    transports
}) : buildNoWcConfig();
}),
"[project]/frontend/src/lib/WalletReadyContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletReadyContext",
    ()=>WalletReadyContext,
    "useWalletReady",
    ()=>useWalletReady
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
const WalletReadyContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(false);
function useWalletReady() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(WalletReadyContext);
}
}),
"[project]/frontend/src/components/WalletProviders.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WalletProviders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$context$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/context.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$chunk$2d$RZWDCITT$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/chunk-RZWDCITT.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/wagmi.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/WalletReadyContext.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function WalletProviders({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$context$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WagmiProvider"], {
        config: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"],
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["RainbowKitProvider"], {
            theme: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$chunk$2d$RZWDCITT$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["darkTheme"])({
                accentColor: '#00B0A0',
                accentColorForeground: '#071311',
                borderRadius: 'medium'
            }),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WalletReadyContext"].Provider, {
                value: true,
                children: children
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/WalletProviders.tsx",
                lineNumber: 27,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/WalletProviders.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/WalletProviders.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/Providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/TransactionContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ThemeProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletProviders$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/WalletProviders.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function Providers({ children }) {
    const [queryClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClient"]({
            defaultOptions: {
                queries: {
                    staleTime: 30_000,
                    gcTime: 5 * 60_000,
                    refetchOnWindowFocus: false,
                    retry: 2
                }
            }
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        attribute: "class",
        defaultTheme: "dark",
        enableSystem: true,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
            client: queryClient,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletProviders$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransactionProvider"], {
                    children: children
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/Providers.tsx",
                    lineNumber: 36,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/Providers.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/Providers.tsx",
            lineNumber: 34,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/Providers.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/WalletButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletButton",
    ()=>WalletButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function WalletButton() {
    const [showToast, setShowToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleClick = ()=>{
        setShowToast(true);
        setTimeout(()=>setShowToast(false), 3000);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleClick,
                "aria-label": "Connect Wallet",
                className: "px-2.5 sm:px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/40 text-goodgreen text-sm font-medium hover:bg-goodgreen/30 transition-colors whitespace-nowrap",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-flex items-center gap-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-4 h-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/WalletButton.tsx",
                                lineNumber: 22,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/WalletButton.tsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "hidden sm:inline",
                            children: "Connect Wallet"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/WalletButton.tsx",
                            lineNumber: 24,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/WalletButton.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/WalletButton.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            showToast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-dark-50 border border-goodgreen/30 text-sm text-gray-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200",
                role: "status",
                "aria-live": "polite",
                children: "🚀 L2 testnet launching soon — wallet connect coming!"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/WalletButton.tsx",
                lineNumber: 28,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/frontend/src/components/WalletButtonConnected.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletButtonConnected",
    ()=>WalletButtonConnected
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-ssr] (ecmascript) <locals>");
'use client';
;
;
function WalletButtonConnected() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ConnectButton"].Custom, {
        children: ({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted })=>{
            const connected = mounted && account && chain;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shrink-0",
                ...!mounted && {
                    'aria-hidden': true,
                    style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }
                },
                children: (()=>{
                    if (!connected) {
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: openConnectModal,
                            "aria-label": "Connect Wallet",
                            className: "px-2.5 sm:px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium hover:bg-goodgreen/10 transition-colors whitespace-nowrap",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "hidden sm:inline",
                                    children: "Connect Wallet"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                    lineNumber: 34,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4 sm:hidden",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                        lineNumber: 36,
                                        columnNumber: 23
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                    lineNumber: 35,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                            lineNumber: 29,
                            columnNumber: 19
                        }, this);
                    }
                    if (chain.unsupported) {
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: openChainModal,
                            className: "px-2.5 sm:px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-colors whitespace-nowrap",
                            children: "Wrong Network"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                            lineNumber: 44,
                            columnNumber: 19
                        }, this);
                    }
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openAccountModal,
                        "aria-label": `Wallet account ${account.displayName}`,
                        className: "flex max-w-[5.5rem] sm:max-w-none items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-dark-50 border border-gray-700/50 hover:border-goodgreen/30 transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2 h-2 shrink-0 rounded-full bg-goodgreen"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                lineNumber: 59,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "min-w-0 max-w-[4.25rem] truncate text-sm text-white font-medium sm:max-w-none",
                                children: account.displayName
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                lineNumber: 60,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400 hidden sm:inline",
                                children: account.displayBalance
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                                lineNumber: 63,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                        lineNumber: 54,
                        columnNumber: 17
                    }, this);
                })()
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
                lineNumber: 19,
                columnNumber: 11
            }, this);
        }
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/WalletButtonConnected.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/tokens.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POPULAR_TOKENS",
    ()=>POPULAR_TOKENS,
    "TOKENS",
    ()=>TOKENS,
    "TOKEN_CATEGORIES",
    ()=>TOKEN_CATEGORIES,
    "TOKEN_COLORS",
    ()=>TOKEN_COLORS,
    "resolveCategory",
    ()=>resolveCategory
]);
const TOKEN_CATEGORIES = [
    'DeFi',
    'Stablecoins',
    'Layer 2',
    'Infrastructure',
    'GoodDollar'
];
function resolveCategory(raw, categories) {
    if (raw === '') {
        return {
            value: 'All',
            mode: 'all',
            raw
        };
    }
    // 'All' (any case) is the synthetic "show everything" sentinel.
    if (raw.toLowerCase() === 'all') {
        return {
            value: 'All',
            mode: 'all',
            raw
        };
    }
    // Exact match against canonical TOKEN_CATEGORIES.
    if (categories.includes(raw)) {
        return {
            value: raw,
            mode: 'exact',
            raw
        };
    }
    // Case-insensitive match — the typo is salvageable, e.g. "defi" → "DeFi".
    const lowered = raw.toLowerCase();
    const caseFixed = categories.find((c)=>c.toLowerCase() === lowered);
    if (caseFixed) {
        return {
            value: caseFixed,
            mode: 'case-fixed',
            raw
        };
    }
    // Nothing matched. Fall back to 'All' and let the routing layer show
    // a notice + canonicalise the URL.
    return {
        value: 'All',
        mode: 'unknown',
        raw
    };
}
const TOKENS = [
    {
        symbol: 'G$',
        name: 'GoodDollar',
        decimals: 18,
        popular: true,
        category: 'GoodDollar'
    },
    {
        symbol: 'ETH',
        name: 'Ether',
        decimals: 18,
        popular: true,
        category: 'Infrastructure'
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        popular: true,
        category: 'Stablecoins'
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        popular: true,
        category: 'Infrastructure'
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        popular: true,
        category: 'Stablecoins'
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        popular: true,
        category: 'Stablecoins'
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 18,
        category: 'Infrastructure'
    },
    {
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'AAVE',
        name: 'Aave',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'ARB',
        name: 'Arbitrum',
        decimals: 18,
        category: 'Layer 2'
    },
    {
        symbol: 'OP',
        name: 'Optimism',
        decimals: 18,
        category: 'Layer 2'
    },
    {
        symbol: 'MKR',
        name: 'Maker',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'COMP',
        name: 'Compound',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'SNX',
        name: 'Synthetix',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'CRV',
        name: 'Curve DAO',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'LDO',
        name: 'Lido DAO',
        decimals: 18,
        category: 'DeFi'
    },
    {
        symbol: 'MATIC',
        name: 'Polygon',
        decimals: 18,
        category: 'Layer 2'
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        category: 'Infrastructure'
    }
];
const POPULAR_TOKENS = TOKENS.filter((t)=>t.popular);
const TOKEN_COLORS = {
    'G$': '#00B0A0',
    'ETH': '#627EEA',
    'USDC': '#2775CA',
    'WBTC': '#F7931A',
    'DAI': '#F5AC37',
    'USDT': '#26A17B',
    'LINK': '#2A5ADA',
    'UNI': '#FF007A',
    'AAVE': '#B6509E',
    'ARB': '#28A0F0',
    'OP': '#FF0420',
    'MKR': '#1AAB9B',
    'COMP': '#00D395',
    'SNX': '#170659',
    'CRV': '#FD2700',
    'LDO': '#00A3FF',
    'MATIC': '#8247E5',
    'WETH': '#627EEA'
};
}),
"[project]/frontend/src/components/TokenIcon.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TokenIcon",
    ()=>TokenIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/tokens.ts [app-ssr] (ecmascript)");
;
;
;
function GoodDollarIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#00B0A0"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                x: "16",
                y: "17",
                textAnchor: "middle",
                dominantBaseline: "central",
                fill: "white",
                fontWeight: "700",
                fontSize: "13",
                fontFamily: "system-ui, -apple-system, sans-serif",
                children: "G$"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
function EthIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#627EEA"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.498 4v8.87l7.497 3.35L16.498 4z",
                fill: "#fff",
                fillOpacity: ".6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.498 4L9 16.22l7.498-3.35V4z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.498 21.968v6.027L24 17.616l-7.502 4.352z",
                fill: "#fff",
                fillOpacity: ".6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.498 27.995v-6.028L9 17.616l7.498 10.379z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.498 20.573l7.497-4.353-7.497-3.348v7.701z",
                fill: "#fff",
                fillOpacity: ".2"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 16.22l7.498 4.353v-7.701L9 16.22z",
                fill: "#fff",
                fillOpacity: ".6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
function UsdcIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#2775CA"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M20.4 18.2c0-2.1-1.3-2.8-3.8-3.1-1.8-.3-2.2-.7-2.2-1.5s.6-1.3 1.8-1.3c1.1 0 1.6.4 1.9 1.2.1.1.2.2.3.2h.7c.2 0 .3-.1.3-.3v-.1c-.3-1.1-1.1-1.9-2.3-2.1v-1.3c0-.2-.1-.3-.3-.3h-.6c-.2 0-.3.1-.3.3v1.2c-1.6.2-2.6 1.2-2.6 2.5 0 2 1.2 2.7 3.7 3 1.7.3 2.3.6 2.3 1.6 0 1-.8 1.6-2 1.6-1.5 0-2.1-.6-2.3-1.5 0-.1-.2-.2-.3-.2h-.8c-.2 0-.3.1-.3.3v.1c.3 1.3 1.2 2.1 2.8 2.4v1.3c0 .2.1.3.3.3h.6c.2 0 .3-.1.3-.3v-1.3c1.7-.3 2.8-1.3 2.8-2.7z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13.1 25.1c-4.2-1.5-6.3-6.1-4.8-10.2 .8-2.2 2.6-3.9 4.8-4.7.2-.1.3-.2.3-.4V9.1c0-.2-.1-.3-.3-.3-.1 0-.1 0-.2 0C8.2 10.5 5.7 15.6 7.4 20.3c1 2.8 3.2 5 6 6 .2.1.4 0 .4-.2v-.7c.1-.2 0-.3-.2-.4l-.5.1zM19.1 8.8c-.2-.1-.4 0-.4.2v.7c0 .2.1.3.3.4 4.2 1.5 6.3 6.1 4.8 10.2-.8 2.2-2.6 3.9-4.8 4.7-.2.1-.3.2-.3.4v.7c0 .2.1.3.3.3.1 0 .1 0 .2 0 4.7-1.7 7.2-6.8 5.5-11.5-1-2.8-3.2-5-6-6l.4 0z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
function WbtcIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#F7931A"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M21.8 13.8c.3-1.8-1.1-2.8-3-3.4l.6-2.5-1.5-.4-.6 2.4c-.4-.1-.8-.2-1.2-.3l.6-2.4-1.5-.4-.6 2.5c-.3-.1-.6-.2-1-.2l-2-.5-.4 1.6s1.1.3 1.1.3c.6.2.7.6.7 1l-.7 2.8c0 0 .1 0 .1 0l-.1 0-1 4c-.1.2-.3.5-.7.4 0 0-1.1-.3-1.1-.3l-.8 1.7 1.9.5c.4.1.7.2 1 .3l-.6 2.5 1.5.4.6-2.5c.4.1.8.2 1.2.3l-.6 2.5 1.5.4.6-2.5c2.6.5 4.5.3 5.3-2 .7-1.9 0-2.9-1.4-3.6 1-.2 1.7-1 2-2.4zm-3.5 4.9c-.5 2-3.8.9-4.9.6l.9-3.5c1.1.3 4.5.8 4 2.9zm.5-5c-.4 1.8-3.2.9-4.1.7l.8-3.2c.9.2 3.8.7 3.3 2.5z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
function DaiIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#F5AC37"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16 6l8.5 10L16 26 7.5 16 16 6z",
                fill: "#fff",
                fillOpacity: ".9"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16 6L7.5 16 16 20.5 24.5 16 16 6z",
                fill: "#fff",
                fillOpacity: ".6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
function UsdtIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#26A17B"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M17.9 17.1v-.1c-.1 0-.7-.1-2-.1-1 0-1.7 0-1.9.1v.1c-3.4.2-5.9.8-5.9 1.5s2.5 1.4 5.9 1.5v5h3.8v-5c3.4-.2 5.9-.8 5.9-1.5s-2.5-1.4-5.8-1.5zm-2 2.6c-4.1 0-7.3-.7-7.3-1.1 0-.5 3.2-1.1 7.3-1.1s7.3.7 7.3 1.1c0 .4-3.3 1.1-7.3 1.1z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M17.9 14.6V11h4.5V7.8H9.5V11h4.5v3.6c-4 .2-7 1-7 1.9s3 1.7 7 1.9v6.5h3.9v-6.5c4-.2 7-1 7-1.9s-3-1.7-6.9-1.9z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
function LinkIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#2A5ADA"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16 6l-2.5 1.4-6 3.5L5 12.3v7.4l2.5 1.4 6 3.5L16 26l2.5-1.4 6-3.5 2.5-1.4v-7.4l-2.5-1.4-6-3.5L16 6zm4.5 14.5l-4.5 2.6-4.5-2.6v-5.2L16 12.7l4.5 2.6v5.2z",
                fill: "#fff"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
function UniIcon({ size }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: "#FF007A"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                x: "16",
                y: "17",
                textAnchor: "middle",
                dominantBaseline: "central",
                fill: "white",
                fontWeight: "700",
                fontSize: "11",
                fontFamily: "system-ui, -apple-system, sans-serif",
                children: "UNI"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
function GenericTokenIcon({ symbol, size }) {
    const color = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOKEN_COLORS"][symbol] || '#6B7280';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "16",
                cy: "16",
                r: "16",
                fill: color
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                x: "16",
                y: "17",
                textAnchor: "middle",
                dominantBaseline: "central",
                fill: "white",
                fontWeight: "700",
                fontSize: symbol.length > 3 ? '9' : '11',
                fontFamily: "system-ui, -apple-system, sans-serif",
                children: symbol.length > 4 ? symbol.slice(0, 3) : symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenIcon.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
const ICON_COMPONENTS = {
    'G$': GoodDollarIcon,
    'ETH': EthIcon,
    'WETH': EthIcon,
    'USDC': UsdcIcon,
    'WBTC': WbtcIcon,
    'DAI': DaiIcon,
    'USDT': UsdtIcon,
    'LINK': LinkIcon,
    'UNI': UniIcon
};
const TokenIcon = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["memo"])(function TokenIcon({ symbol, size = 20, className }) {
    const icon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const Component = ICON_COMPONENTS[symbol];
        return Component ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
            size: size
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/TokenIcon.tsx",
            lineNumber: 143,
            columnNumber: 24
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GenericTokenIcon, {
            symbol: symbol,
            size: size
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/TokenIcon.tsx",
            lineNumber: 143,
            columnNumber: 52
        }, this);
    }, [
        symbol,
        size
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex items-center justify-center shrink-0 ${className ?? ''}`,
        children: icon
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/TokenIcon.tsx",
        lineNumber: 147,
        columnNumber: 5
    }, this);
});
}),
"[project]/frontend/src/components/TransactionPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TransactionPanel",
    ()=>TransactionPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/TransactionContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/WalletReadyContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TokenIcon.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function relativeTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
function StatusIcon({ status }) {
    if (status === 'pending') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-5 h-5 rounded-full border-2 border-goodgreen border-t-transparent animate-spin"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this);
    }
    if (status === 'confirmed') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-5 h-5 rounded-full bg-goodgreen/10 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-3 h-3 text-goodgreen",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 3,
                    d: "M5 13l4 4L19 7"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                    lineNumber: 29,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 28,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
            lineNumber: 27,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-3 h-3 text-red-400",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 3,
                d: "M6 18L18 6M6 6l12 12"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
function TransactionRow({ tx }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3 px-4 py-3 hover:bg-dark-50/40 transition-colors",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center -space-x-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TokenIcon"], {
                        symbol: tx.inputSymbol,
                        size: 20
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TokenIcon"], {
                        symbol: tx.outputSymbol,
                        size: 20
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-white truncate",
                        children: [
                            "Swap ",
                            tx.inputAmount,
                            " ",
                            tx.inputSymbol,
                            " for ",
                            tx.outputAmount,
                            " ",
                            tx.outputSymbol
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500",
                        children: relativeTime(tx.timestamp)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusIcon, {
                status: tx.status
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
function EmptyStateDisconnected() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-8 px-4 text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 mx-auto mb-3 rounded-full bg-goodgreen/10 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5 text-goodgreen",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 1.5,
                        d: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-white mb-1",
                children: "Connect your wallet"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-500",
                children: "Your swap history and pending transactions will appear here"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
function EmptyStateConnected({ onClose }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-8 px-4 text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 mx-auto mb-3 rounded-full bg-goodgreen/10 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5 text-goodgreen",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 1.5,
                        d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                    lineNumber: 83,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-white mb-1",
                children: "No swaps yet"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-500 mb-3",
                children: "Complete your first swap and it'll show up here"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onClose,
                className: "px-4 py-1.5 text-xs font-medium rounded-lg bg-goodgreen/10 text-goodgreen hover:bg-goodgreen/10 transition-colors",
                children: "Start Swapping"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
function TransactionPanel({ onClose }) {
    const { transactions, clearAll } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransactionContext"])();
    const walletReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWalletReady"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "transaction-panel",
        className: "absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-100 border border-gray-700/40 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-3 border-b border-gray-700/20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-semibold text-white",
                        children: "Recent Activity"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    transactions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: clearAll,
                        className: "text-xs text-gray-500 hover:text-gray-300 transition-colors",
                        children: "Clear all"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-h-80 overflow-y-auto",
                children: transactions.length === 0 ? walletReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyStateConnected, {
                    onClose: onClose
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                    lineNumber: 123,
                    columnNumber: 13
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyStateDisconnected, {}, void 0, false, {
                    fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                    lineNumber: 125,
                    columnNumber: 13
                }, this) : transactions.map((tx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TransactionRow, {
                        tx: tx
                    }, tx.id, false, {
                        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                        lineNumber: 128,
                        columnNumber: 34
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TransactionPanel.tsx",
        lineNumber: 104,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ActivityButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActivityButton",
    ()=>ActivityButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/TransactionContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TransactionPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TransactionPanel.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function ActivityButton() {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const { pendingCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$TransactionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransactionContext"])();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function handleEscape(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);
        return ()=>{
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [
        open
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen((o)=>!o),
                "aria-label": "Recent activity",
                className: "relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                        className: "w-5 h-5"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ActivityButton.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    pendingCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-goodgreen text-[10px] font-bold text-dark flex items-center justify-center animate-pulse",
                        children: pendingCount
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ActivityButton.tsx",
                        lineNumber: 38,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ActivityButton.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 z-40 bg-black/20",
                        onClick: ()=>setOpen(false),
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ActivityButton.tsx",
                        lineNumber: 46,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TransactionPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransactionPanel"], {
                        onClose: ()=>setOpen(false)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ActivityButton.tsx",
                        lineNumber: 51,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ActivityButton.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ThemeToggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeToggle",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-ssr] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function ThemeToggle() {
    const { theme, setTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>setMounted(true), []);
    if (!mounted) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-9 h-9",
        "aria-hidden": "true"
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ThemeToggle.tsx",
        lineNumber: 13,
        columnNumber: 24
    }, this);
    const isDark = theme === 'dark' || theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode',
        onClick: ()=>setTheme(isDark ? 'light' : 'dark'),
        className: "p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
        children: isDark ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
            className: "w-4 h-4"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ThemeToggle.tsx",
            lineNumber: 23,
            columnNumber: 17
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
            className: "w-4 h-4"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ThemeToggle.tsx",
            lineNumber: 23,
            columnNumber: 47
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ThemeToggle.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/Header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-ssr] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-ssr] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/WalletButton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletButtonConnected$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/WalletButtonConnected.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/WalletReadyContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ActivityButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ActivityButton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ThemeToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ThemeToggle.tsx [app-ssr] (ecmascript)");
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
function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const walletReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWalletReady"])();
    const isSwap = pathname === '/';
    const isExplore = pathname === '/explore';
    const isPool = pathname === '/pool';
    const isBridge = pathname === '/bridge';
    const isStable = pathname?.startsWith('/stable');
    const isStocks = pathname?.startsWith('/stocks');
    const isPredict = pathname?.startsWith('/predict');
    const isPerps = pathname?.startsWith('/perps');
    const isLend = pathname?.startsWith('/lend');
    const isYield = pathname?.startsWith('/yield');
    const isGovernance = pathname?.startsWith('/governance');
    const isUBIImpact = pathname?.startsWith('/ubi-impact');
    const isAgents = pathname?.startsWith('/agents');
    const isActivity = pathname?.startsWith('/activity');
    const isTestDashboard = pathname?.startsWith('/test-dashboard');
    const isTestnetGuide = pathname?.startsWith('/testnet-guide');
    const isFaucet = pathname?.startsWith('/faucet');
    const isInvite = pathname?.startsWith('/invite');
    const isPortfolio = pathname === '/portfolio';
    const isProof = pathname?.startsWith('/live-prices-proof') || pathname?.startsWith('/proof');
    // Internal QA dashboard link is hidden in production. Devs/QA can enable
    // it locally with NEXT_PUBLIC_SHOW_DEV_NAV=1. The /test-dashboard route
    // itself remains reachable via direct URL. See task 0070.
    const showDevNav = process.env.NEXT_PUBLIC_SHOW_DEV_NAV === '1';
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!mobileMenuOpen) return;
        document.body.style.overflow = 'hidden';
        function handleEscape(e) {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        }
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        }
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        return ()=>{
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [
        mobileMenuOpen
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "w-full border-b border-dark-50/50 bg-dark-100/80 backdrop-blur-md relative z-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto flex items-center justify-between px-4 h-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex min-w-0 items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 shrink-0 rounded-full bg-goodgreen flex items-center justify-center font-bold text-dark text-sm",
                                children: "G$"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline text-lg font-semibold text-white",
                                children: "GoodDollar"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        "aria-label": "Primary",
                        className: "hidden 2xl:flex items-center gap-5 text-sm text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/",
                                className: isSwap ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Swap"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/explore",
                                className: isExplore ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Explore"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/pool",
                                className: `flex items-center gap-1.5 ${isPool ? 'text-white font-medium' : 'hover:text-white transition-colors'}`,
                                children: [
                                    "Pool",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "soon-badge",
                                        className: "px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30",
                                        children: "Soon"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/bridge",
                                className: `flex items-center gap-1.5 ${isBridge ? 'text-white font-medium' : 'hover:text-white transition-colors'}`,
                                children: [
                                    "Bridge",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "soon-badge",
                                        className: "px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30",
                                        children: "Soon"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/stocks",
                                className: isStocks ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Stocks"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/predict",
                                className: isPredict ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Predict"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 92,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/perps",
                                className: isPerps ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Perps"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/lend",
                                className: isLend ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Lend"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/stable",
                                className: isStable ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Stable"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/yield",
                                className: isYield ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Yield"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/governance",
                                className: isGovernance ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Govern"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/agents",
                                className: isAgents ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Agents"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/ubi-impact",
                                className: isUBIImpact ? 'text-green-400 font-medium' : 'text-green-400/60 hover:text-green-400 transition-colors',
                                children: "UBI"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 99,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/activity",
                                className: isActivity ? 'text-goodgreen font-medium' : 'text-goodgreen hover:text-goodgreen transition-colors',
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex items-center gap-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/Header.tsx",
                                            lineNumber: 102,
                                            columnNumber: 15
                                        }, this),
                                        "Activity"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "w-px h-4 bg-white/10"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 106,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/faucet",
                                className: isFaucet ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors',
                                children: "Faucet"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/testnet-guide",
                                className: isTestnetGuide ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors',
                                children: "Guide"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/live-prices-proof",
                                className: isProof ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors',
                                "data-testid": "nav-proof",
                                children: "Proof"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/invite",
                                className: isInvite ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors',
                                children: "Invite"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        "data-testid": "condensed-nav",
                        "aria-label": "Primary condensed",
                        className: "hidden lg:flex 2xl:hidden items-center gap-3 text-sm text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/",
                                className: isSwap ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Swap"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 114,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/stocks",
                                className: isStocks ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Stocks"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/perps",
                                className: isPerps ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Perps"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/predict",
                                className: isPredict ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Predict"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 117,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/lend",
                                className: isLend ? 'text-white font-medium' : 'hover:text-white transition-colors',
                                children: "Lend"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                className: "relative group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                        className: "list-none cursor-pointer flex items-center gap-1 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none rounded-md px-1",
                                        children: [
                                            "More",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                className: "w-3.5 h-3.5 transition-transform group-open:rotate-180"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 122,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                        lineNumber: 120,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute right-0 top-full mt-3 w-48 rounded-xl border border-dark-50 bg-dark-100/95 shadow-xl shadow-black/30 backdrop-blur-md p-2 z-50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/explore",
                                                className: `block px-3 py-2 rounded-lg ${isExplore ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: "Explore"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 125,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/pool",
                                                className: `flex items-center justify-between px-3 py-2 rounded-lg ${isPool ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: [
                                                    "Pool",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-orange-400",
                                                        children: "Soon"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                                        lineNumber: 128,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 126,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/bridge",
                                                className: `flex items-center justify-between px-3 py-2 rounded-lg ${isBridge ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: [
                                                    "Bridge",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-orange-400",
                                                        children: "Soon"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                                        lineNumber: 132,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 130,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/stable",
                                                className: `block px-3 py-2 rounded-lg ${isStable ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: "Stable"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 134,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/yield",
                                                className: `block px-3 py-2 rounded-lg ${isYield ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: "Yield"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 135,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/governance",
                                                className: `block px-3 py-2 rounded-lg ${isGovernance ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: "Govern"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 136,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/agents",
                                                className: `block px-3 py-2 rounded-lg ${isAgents ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`,
                                                children: "Agents"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 137,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/ubi-impact",
                                                className: `block px-3 py-2 rounded-lg ${isUBIImpact ? 'text-green-400 bg-dark-50/50 font-medium' : 'text-green-300 hover:text-green-400 hover:bg-dark-50/50'}`,
                                                children: "UBI"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 138,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/activity",
                                                className: `block px-3 py-2 rounded-lg ${isActivity ? 'text-goodgreen bg-dark-50/50 font-medium' : 'text-goodgreen/80 hover:text-goodgreen hover:bg-dark-50/50'}`,
                                                children: "Activity"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 139,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border-t border-dark-50/50 my-1"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 140,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/faucet",
                                                className: `block px-3 py-2 rounded-lg ${isFaucet ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`,
                                                children: "Faucet"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 141,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/testnet-guide",
                                                className: `block px-3 py-2 rounded-lg ${isTestnetGuide ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`,
                                                children: "Guide"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 142,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/live-prices-proof",
                                                className: `block px-3 py-2 rounded-lg ${isProof ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`,
                                                children: "Proof"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 143,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                prefetch: false,
                                                href: "/invite",
                                                className: `block px-3 py-2 rounded-lg ${isInvite ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`,
                                                children: "Invite"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 144,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                        lineNumber: 124,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                prefetch: false,
                                href: "/portfolio",
                                "aria-label": "Portfolio",
                                className: `p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none ${isPortfolio ? 'text-white bg-dark-50' : 'text-gray-400 hover:text-white hover:bg-dark-50'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 154,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ThemeToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeToggle"], {}, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 156,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ActivityButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ActivityButton"], {}, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 157,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                "aria-label": mobileMenuOpen ? 'Close menu' : 'Open menu',
                                onClick: ()=>setMobileMenuOpen((o)=>!o),
                                className: "lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                                children: mobileMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 164,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 166,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 158,
                                columnNumber: 11
                            }, this),
                            walletReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletButtonConnected$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WalletButtonConnected"], {}, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 169,
                                columnNumber: 26
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WalletButton"], {}, void 0, false, {
                                fileName: "[project]/frontend/src/components/Header.tsx",
                                lineNumber: 169,
                                columnNumber: 54
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/Header.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            mobileMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed left-0 right-0 bottom-0 top-16 z-40 bg-black/50 lg:hidden",
                        onClick: ()=>setMobileMenuOpen(false),
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: menuRef,
                        "data-testid": "mobile-nav",
                        className: "lg:hidden border-t border-dark-50/50 bg-dark-100 backdrop-blur-md animate-in slide-in-from-top-2 duration-200 relative z-50",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            "aria-label": "Mobile",
                            className: "flex flex-col px-4 py-3 gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isSwap ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Swap"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 186,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/explore",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isExplore ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Explore"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 192,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/pool",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isPool ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: [
                                        "Pool",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "data-testid": "soon-badge",
                                            className: "px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30",
                                            children: "Coming Soon"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/Header.tsx",
                                            lineNumber: 203,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 198,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/bridge",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isBridge ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: [
                                        "Bridge",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "data-testid": "soon-badge",
                                            className: "px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30",
                                            children: "Coming Soon"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/Header.tsx",
                                            lineNumber: 212,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 207,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/stocks",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isStocks ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Stocks"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 216,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/predict",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isPredict ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Predict"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 222,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/perps",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isPerps ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Perps"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 228,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/lend",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isLend ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Lend"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 234,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/stable",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isStable ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Stable"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 240,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/yield",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isYield ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Yield"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 246,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/governance",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isGovernance ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Govern"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 252,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/agents",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isAgents ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "🤖 Agents"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 258,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/ubi-impact",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isUBIImpact ? 'text-green-400 font-medium bg-dark-50/50' : 'text-green-400/60 hover:text-green-400'}`,
                                    children: "🌍 UBI Impact"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 264,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/activity",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isActivity ? 'text-goodgreen font-medium bg-dark-50/50' : 'text-goodgreen hover:text-goodgreen'}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "inline-block w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/Header.tsx",
                                                lineNumber: 275,
                                                columnNumber: 17
                                            }, this),
                                            "Activity"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/Header.tsx",
                                        lineNumber: 274,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 270,
                                    columnNumber: 13
                                }, this),
                                showDevNav && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/test-dashboard",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isTestDashboard ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Tests"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 280,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-t border-dark-50/50 my-1"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 287,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold",
                                    children: "Testnet"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 288,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/faucet",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isFaucet ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`,
                                    children: "🚰 Faucet"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 289,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/testnet-guide",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isTestnetGuide ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`,
                                    children: "📖 Testnet Guide"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 295,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/invite",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isInvite ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`,
                                    children: "✉️ Invite Testers"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 301,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-t border-dark-50/50 my-1"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    prefetch: false,
                                    href: "/portfolio",
                                    onClick: ()=>setMobileMenuOpen(false),
                                    className: `flex items-center justify-between px-3 py-2.5 rounded-lg ${isPortfolio ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`,
                                    children: "Portfolio"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/Header.tsx",
                                    lineNumber: 308,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/Header.tsx",
                            lineNumber: 185,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/Header.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/Header.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/UBIBanner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UBIBanner",
    ()=>UBIBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
const STORAGE_KEY = 'ubi-banner-dismissed';
function UBIBanner() {
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (("TURBOPACK compile-time value", "undefined") !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== 'true') //TURBOPACK unreachable
        ;
    }, []);
    if (!visible) return null;
    const dismiss = ()=>{
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "region",
        "aria-label": "UBI Impact",
        className: "w-full bg-goodgreen/[0.06] border-b border-goodgreen/10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto flex items-center justify-between px-4 py-1.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-gray-300 flex-1 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-goodgreen mr-1.5",
                            children: "♥"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-goodgreen font-medium",
                            children: "$2.4M"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this),
                        ' ',
                        "distributed to",
                        ' ',
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-goodgreen font-medium",
                            children: "640K+"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        ' ',
                        "people through UBI — funded by your trades"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: dismiss,
                    "aria-label": "Dismiss UBI banner",
                    className: "ml-3 shrink-0 p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-3.5 h-3.5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M6 18L18 6M6 6l12 12"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                            lineNumber: 39,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                        lineNumber: 38,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/UBIBanner.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/UBIBanner.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/UBIBanner.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/PageTransition.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageTransition",
    ()=>PageTransition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
function PageTransition({ children }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-transition-enter flex-1 flex flex-col items-center w-full",
        children: children
    }, pathname, false, {
        fileName: "[project]/frontend/src/components/PageTransition.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/AxeDevTools.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AxeDevTools",
    ()=>AxeDevTools
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
function AxeDevTools() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            __turbopack_context__.A("[project]/node_modules/@axe-core/react/dist/index.mjs [app-ssr] (ecmascript, async loader)").then((axe)=>{
                const React = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
                const ReactDOM = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
                axe.default(React, ReactDOM, 1000);
            });
        }
    }, []);
    return null;
}
}),
"[project]/frontend/src/lib/registerServiceWorker.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isOffline",
    ()=>isOffline,
    "isServiceWorkerActive",
    ()=>isServiceWorkerActive,
    "registerServiceWorker",
    ()=>registerServiceWorker,
    "requestBackgroundSync",
    ()=>requestBackgroundSync
]);
// Service Worker Registration for GoodDollar L2
// Provides offline caching and performance optimizations
'use client';
async function registerServiceWorker() {
    if (("TURBOPACK compile-time value", "undefined") === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
    }
    //TURBOPACK unreachable
    ;
    // Only register in production or when explicitly enabled
    const isProduction = undefined;
    const enableSW = undefined;
}
function showUpdateNotification() {
    // Create a subtle update notification
    const notification = document.createElement('div');
    notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #00B0A0;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 176, 160, 0.3);
      z-index: 9999;
      cursor: pointer;
      transition: opacity 0.3s ease;
    ">
      🔄 App updated! Click to reload
    </div>
  `;
    const notificationEl = notification.firstElementChild;
    document.body.appendChild(notificationEl);
    // Auto-hide after 10 seconds
    setTimeout(()=>{
        if (notificationEl.parentNode) {
            notificationEl.style.opacity = '0';
            setTimeout(()=>{
                notificationEl.remove();
            }, 300);
        }
    }, 10_000);
    // Reload on click
    notificationEl.addEventListener('click', ()=>{
        window.location.reload();
    });
}
function isOffline() {
    return !navigator.onLine;
}
function isServiceWorkerActive() {
    return !!navigator.serviceWorker?.controller;
}
function requestBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration)=>{
            return registration.sync.register(tag);
        }).catch((error)=>{
            console.error('Background sync registration failed:', error);
        });
    }
}
}),
"[project]/frontend/src/components/ServiceWorkerRegistration.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ServiceWorkerRegistration",
    ()=>ServiceWorkerRegistration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$registerServiceWorker$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/registerServiceWorker.ts [app-ssr] (ecmascript)");
'use client';
;
;
function ServiceWorkerRegistration() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Register service worker after initial page load
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$registerServiceWorker$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerServiceWorker"])();
    }, []);
    // This component doesn't render anything
    return null;
}
}),
"[project]/frontend/src/components/GlobalErrorBoundary.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlobalErrorBoundary",
    ()=>GlobalErrorBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-ccw.js [app-ssr] (ecmascript) <export default as RefreshCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-ssr] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-ssr] (ecmascript) <export default as MessageCircle>");
'use client';
;
;
;
class GlobalErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Component"] {
    maxRetries = 3;
    retryTimeouts = [];
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({
            errorInfo
        });
        // Log error and report to monitoring service
        this.logError(error, errorInfo);
        // Attempt automatic retry for certain error types
        if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
            this.scheduleRetry();
        }
    }
    componentWillUnmount() {
        // Clean up any pending retry timeouts
        this.retryTimeouts.forEach((timeout)=>clearTimeout(timeout));
    }
    categorizeError(error) {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        if (message.includes('wallet') || message.includes('web3') || message.includes('transaction') || message.includes('ethereum') || stack.includes('wagmi') || stack.includes('viem')) {
            return 'web3';
        }
        if (message.includes('fetch') || message.includes('network') || message.includes('api') || message.includes('cors')) {
            return 'api';
        }
        if (message.includes('loading chunk') || message.includes('import') || message.includes('module') || stack.includes('webpack')) {
            return 'import';
        }
        if (message.includes('script error') || message.includes('non-error promise rejection')) {
            return 'runtime';
        }
        return 'unknown';
    }
    logError(error, errorInfo) {
        const category = this.categorizeError(error);
        const errorReport = {
            category,
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            retryCount: this.state.retryCount
        };
        // Log to console in development
        if ("TURBOPACK compile-time truthy", 1) {
            console.group(`🚨 Global Error Boundary - ${category.toUpperCase()}`);
            console.error('Error:', error);
            console.error('Component Stack:', errorInfo.componentStack);
            console.error('Error Report:', errorReport);
            console.groupEnd();
        }
        // Report to external error tracking service (Sentry, LogRocket, etc.)
        this.reportToMonitoring(errorReport);
        // Store recent errors in localStorage for debugging
        this.storeErrorLocally(errorReport);
    }
    reportToMonitoring(errorReport) {
        // Integration with external error monitoring services
        // Example: Sentry integration
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Example: Custom API reporting
        try {
            fetch('/api/error-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorReport)
            }).catch(()=>{
            // Silently fail if error reporting fails
            });
        } catch  {
        // Silently fail if error reporting fails
        }
    }
    storeErrorLocally(errorReport) {
        try {
            const recentErrors = JSON.parse(localStorage.getItem('recentErrors') || '[]');
            recentErrors.unshift(errorReport);
            // Keep only last 10 errors
            const limitedErrors = recentErrors.slice(0, 10);
            localStorage.setItem('recentErrors', JSON.stringify(limitedErrors));
        } catch  {
        // Silently fail if localStorage is not available
        }
    }
    shouldAutoRetry(error) {
        const category = this.categorizeError(error);
        // Auto-retry for network/import errors but not for runtime errors
        return category === 'api' || category === 'import';
    }
    scheduleRetry() {
        const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000) // Exponential backoff, max 10s
        ;
        const timeout = setTimeout(()=>{
            this.setState((prevState)=>({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                    retryCount: prevState.retryCount + 1
                }));
        }, delay);
        this.retryTimeouts.push(timeout);
    }
    handleManualRetry = ()=>{
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        });
        // Reload the page as a last resort
        window.location.reload();
    };
    handleReportIssue = ()=>{
        const errorDetails = {
            message: this.state.error?.message,
            stack: this.state.error?.stack,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        const issueBody = encodeURIComponent(`
## Error Details
- **Message**: ${errorDetails.message}
- **URL**: ${errorDetails.url}
- **Timestamp**: ${errorDetails.timestamp}

## Additional Context
Please describe what you were doing when this error occurred:

\`\`\`
${errorDetails.stack}
\`\`\`
    `.trim());
        window.open(`https://github.com/GoodDollar/gooddollar-l2/issues/new?title=Frontend%20Error&body=${issueBody}`, '_blank');
    };
    getErrorDisplayInfo() {
        if (!this.state.error) return null;
        const category = this.categorizeError(this.state.error);
        switch(category){
            case 'web3':
                return {
                    title: 'Wallet Connection Issue',
                    description: 'There was a problem with your wallet connection. Please check your wallet and try again.',
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        className: "w-8 h-8 text-orange-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                        lineNumber: 238,
                        columnNumber: 17
                    }, this),
                    canRetry: true
                };
            case 'api':
                return {
                    title: 'Network Connection Issue',
                    description: 'Unable to connect to the server. Please check your internet connection and try again.',
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        className: "w-8 h-8 text-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                        lineNumber: 246,
                        columnNumber: 17
                    }, this),
                    canRetry: true
                };
            case 'import':
                return {
                    title: 'Loading Issue',
                    description: 'Failed to load part of the application. This usually resolves with a refresh.',
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCcw$3e$__["RefreshCcw"], {
                        className: "w-8 h-8 text-purple-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                        lineNumber: 254,
                        columnNumber: 17
                    }, this),
                    canRetry: true
                };
            default:
                return {
                    title: 'Application Error',
                    description: 'Something unexpected happened. Our team has been notified.',
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        className: "w-8 h-8 text-red-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                        lineNumber: 262,
                        columnNumber: 17
                    }, this),
                    canRetry: true
                };
        }
    }
    render() {
        if (this.state.hasError) {
            const errorInfo = this.getErrorDisplayInfo();
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen flex items-center justify-center bg-dark text-white p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-md w-full text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 flex justify-center",
                            children: errorInfo?.icon
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 275,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-2xl font-bold mb-2 text-white",
                            children: errorInfo?.title || 'Something went wrong'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 279,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 mb-8 leading-relaxed",
                            children: errorInfo?.description || 'An unexpected error occurred.'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 283,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                errorInfo?.canRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: this.handleManualRetry,
                                    className: "w-full flex items-center justify-center gap-2 bg-goodgreen hover:bg-goodgreen-600 text-black px-6 py-3 rounded-xl font-semibold transition-colors",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCcw$3e$__["RefreshCcw"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                            lineNumber: 293,
                                            columnNumber: 19
                                        }, this),
                                        "Try Again"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                    lineNumber: 289,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>window.location.href = '/',
                                    className: "w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                            lineNumber: 302,
                                            columnNumber: 17
                                        }, this),
                                        "Go Home"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                    lineNumber: 298,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: this.handleReportIssue,
                                    className: "w-full flex items-center justify-center gap-2 border border-gray-600 hover:bg-gray-800 text-gray-300 px-6 py-3 rounded-xl font-semibold transition-colors",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                            lineNumber: 310,
                                            columnNumber: 17
                                        }, this),
                                        "Report Issue"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                    lineNumber: 306,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 287,
                            columnNumber: 13
                        }, this),
                        ("TURBOPACK compile-time value", "development") === 'development' && this.state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                            className: "mt-8 text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                    className: "cursor-pointer text-gray-500 hover:text-gray-300",
                                    children: "Debug Information"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                    lineNumber: 317,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                    className: "mt-2 p-4 bg-gray-900 rounded-lg text-xs text-red-400 overflow-auto max-h-40",
                                    children: this.state.error.stack
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                                    lineNumber: 320,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 316,
                            columnNumber: 15
                        }, this),
                        this.state.retryCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-4 text-sm text-gray-500",
                            children: [
                                "Retry attempt: ",
                                this.state.retryCount,
                                "/",
                                this.maxRetries
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                            lineNumber: 327,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                    lineNumber: 274,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/GlobalErrorBoundary.tsx",
                lineNumber: 273,
                columnNumber: 9
            }, this);
        }
        return this.props.children;
    }
}
}),
"[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
"[project]/frontend/src/components/ui/toast.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toast",
    ()=>Toast,
    "ToastAction",
    ()=>ToastAction,
    "ToastClose",
    ()=>ToastClose,
    "ToastDescription",
    ()=>ToastDescription,
    "ToastProvider",
    ()=>ToastProvider,
    "ToastTitle",
    ()=>ToastTitle,
    "ToastViewport",
    ()=>ToastViewport,
    "Toaster",
    ()=>Toaster,
    "toastError",
    ()=>toastError,
    "toastPending",
    ()=>toastPending,
    "toastSuccess",
    ()=>toastSuccess,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
// ─── Variants ────────────────────────────────────────────────────────────────
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full', {
    variants: {
        variant: {
            default: 'border-gray-700/50 bg-dark-100 text-foreground',
            success: 'border-goodgreen/30 bg-goodgreen/10 text-goodgreen',
            warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
            destructive: 'border-red-500/30 bg-red-500/10 text-red-400'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});
// ─── Provider & Viewport ─────────────────────────────────────────────────────
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[360px] flex-col gap-2 p-0', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 40,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"].displayName;
// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 58,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-current/30 bg-transparent px-3 text-xs font-medium transition-colors hover:bg-current/10 focus:outline-none focus:ring-2 focus:ring-current/50 disabled:pointer-events-none disabled:opacity-50', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 70,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('ml-auto shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/50', className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/toast.tsx",
            lineNumber: 94,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 85,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-sm font-semibold leading-tight', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 103,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-xs opacity-80 leading-relaxed mt-0.5', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 115,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"].displayName;
const ToastContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"](null);
function useToast() {
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"](ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <Toaster>');
    return ctx;
}
// ─── Helper functions ─────────────────────────────────────────────────────────
let _addToast = null;
/** Internal: called by helper fns after context mounts */ function _ensureToast(toast) {
    if (_addToast) {
        _addToast(toast);
    } else {
        console.warn('[toast] Toaster not yet mounted — toast dropped:', toast.title);
    }
}
function toastPending(title, description) {
    _ensureToast({
        title,
        description,
        variant: 'default',
        duration: 8000
    });
}
function toastSuccess(title, description) {
    _ensureToast({
        title,
        description,
        variant: 'success',
        duration: 5000
    });
}
function toastError(title, description) {
    _ensureToast({
        title,
        description,
        variant: 'destructive',
        duration: 7000
    });
}
function Toaster() {
    const [toasts, setToasts] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const addToast = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"]((toast)=>{
        const id = Math.random().toString(36).slice(2);
        setToasts((prev)=>[
                ...prev,
                {
                    ...toast,
                    id,
                    open: true
                }
            ]);
    }, []);
    const dismissToast = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"]((id)=>{
        setToasts((prev)=>prev.map((t)=>t.id === id ? {
                    ...t,
                    open: false
                } : t));
        setTimeout(()=>setToasts((prev)=>prev.filter((t)=>t.id !== id)), 400);
    }, []);
    // Register global helpers
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        _addToast = addToast;
        return ()=>{
            _addToast = null;
        };
    }, [
        addToast
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContext.Provider, {
        value: {
            toasts,
            addToast,
            dismissToast
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastProvider, {
            swipeDirection: "right",
            children: [
                toasts.map(({ id, title, description, variant, duration, open })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toast, {
                        variant: variant,
                        open: open,
                        duration: duration ?? 5000,
                        onOpenChange: (isOpen)=>{
                            if (!isOpen) dismissToast(id);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastTitle, {
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/toast.tsx",
                                        lineNumber: 208,
                                        columnNumber: 15
                                    }, this),
                                    description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastDescription, {
                                        children: description
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/toast.tsx",
                                        lineNumber: 209,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/ui/toast.tsx",
                                lineNumber: 207,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastClose, {}, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/toast.tsx",
                                lineNumber: 211,
                                columnNumber: 13
                            }, this)
                        ]
                    }, id, true, {
                        fileName: "[project]/frontend/src/components/ui/toast.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastViewport, {}, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/toast.tsx",
                    lineNumber: 214,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/ui/toast.tsx",
            lineNumber: 198,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/toast.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/frontend/src/lib/feedbackContext.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Pure helpers that build the payload sent to `POST /api/feedback`.
 *
 * Kept dependency-free and side-effect-free so unit tests can run in plain
 * jsdom without mocking wagmi, next/navigation, or sessionStorage. Browser
 * data (pathname, wallet, viewport, sessionId, buildSha, recentConsole)
 * is gathered by the calling React component and passed in as the
 * `FeedbackContextInput` argument.
 *
 * Caps mirror the server-side limits enforced in
 * `frontend/src/app/api/feedback/route.ts` so the client never POSTs a
 * payload the server is going to reject for size.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */ __turbopack_context__.s([
    "FEEDBACK_LIMITS",
    ()=>FEEDBACK_LIMITS,
    "FEEDBACK_TYPES",
    ()=>FEEDBACK_TYPES,
    "buildFeedbackPayload",
    ()=>buildFeedbackPayload,
    "capConsoleEntries",
    ()=>capConsoleEntries,
    "isFeedbackType",
    ()=>isFeedbackType,
    "truncate",
    ()=>truncate
]);
const FEEDBACK_TYPES = [
    'bug',
    'ux',
    'feature',
    'other'
];
const FEEDBACK_LIMITS = {
    descriptionMax: 2_000,
    consoleEntryMax: 500,
    consoleMaxEntries: 20,
    totalBodyMaxBytes: 16 * 1024
};
function isFeedbackType(value) {
    return typeof value === 'string' && FEEDBACK_TYPES.includes(value);
}
function truncate(s, max) {
    if (s.length <= max) return s;
    const marker = '…[truncated]';
    if (max <= marker.length) return s.slice(0, max);
    return s.slice(0, max - marker.length) + marker;
}
function capConsoleEntries(entries, max = FEEDBACK_LIMITS.consoleMaxEntries) {
    const recent = entries.length > max ? entries.slice(entries.length - max) : entries.slice();
    return recent.map((e)=>({
            level: e.level,
            message: truncate(e.message, FEEDBACK_LIMITS.consoleEntryMax),
            at: e.at
        }));
}
function buildFeedbackPayload(type, description, ctx, now = ()=>new Date().toISOString()) {
    return {
        type,
        description: truncate(description, FEEDBACK_LIMITS.descriptionMax),
        pathname: ctx.pathname,
        wallet: ctx.wallet,
        viewport: {
            w: ctx.viewport.w,
            h: ctx.viewport.h,
            dpr: ctx.viewport.dpr
        },
        sessionId: ctx.sessionId,
        buildSha: ctx.buildSha,
        recentConsole: capConsoleEntries(ctx.recentConsole),
        timestamp: now()
    };
}
}),
"[project]/frontend/src/components/ConsoleErrorCapture.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConsoleErrorCapture",
    ()=>ConsoleErrorCapture,
    "readConsoleBuffer",
    ()=>readConsoleBuffer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
/**
 * Mounts once at the root of the app and patches `console.error` /
 * `console.warn` so the last N entries are accessible to the feedback
 * dialog via `window.__feedbackConsoleBuffer`.
 *
 * Design notes:
 *   - Patching, not subscribing: there is no DOM API for "subscribe to
 *     console messages", and a global `error` listener only catches uncaught
 *     exceptions, not the dev/runtime warnings we actually care about
 *     (e.g. wagmi or RainbowKit complaints).
 *   - Bounded ring buffer (capped at 20 entries) so a noisy page cannot
 *     leak memory.
 *   - Idempotent: re-mounting (React 18 dev double-effects, fast refresh)
 *     never installs the patch twice.
 *   - Side-effect-free for server-rendering: the effect only runs in the
 *     browser.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */ const MAX_ENTRIES = 20;
function ConsoleErrorCapture() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const buffer = undefined;
        const origError = undefined;
        const origWarn = undefined;
        const stringifyArgs = undefined;
        const push = undefined;
    // Intentionally no teardown: the patch outlives the mount, otherwise
    // React dev mode's double-effect cycle would reinstall it twice.
    }, []);
    return null;
}
function readConsoleBuffer() {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
    const buf = undefined;
}
}),
"[project]/frontend/src/components/FeedbackButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FeedbackButton",
    ()=>FeedbackButton,
    "getFeedbackButtonClasses",
    ()=>getFeedbackButtonClasses
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$feedbackContext$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/feedbackContext.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConsoleErrorCapture$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ConsoleErrorCapture.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const FEEDBACK_TYPES = [
    {
        value: 'bug',
        label: '🐛 Bug Report'
    },
    {
        value: 'ux',
        label: '💡 UX Issue'
    },
    {
        value: 'feature',
        label: '✨ Feature Request'
    },
    {
        value: 'other',
        label: '💬 Other'
    }
];
/**
 * Lazily-allocated session id, cached in `sessionStorage` so it persists
 * across SPA navigations within a single tab. Falling back to a random id
 * means we never crash a private-mode browser that disallows storage.
 */ function getSessionId() {
    if ("TURBOPACK compile-time truthy", 1) return 'ssr';
    //TURBOPACK unreachable
    ;
}
function getBuildSha() {
    return process.env.NEXT_PUBLIC_BUILD_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev';
}
function isStocksRoute(pathname) {
    return pathname === '/stocks' || pathname.startsWith('/stocks/');
}
function getFeedbackButtonClasses(pathname) {
    const stocks = isStocksRoute(pathname);
    if (!stocks) {
        return {
            button: 'fixed bottom-6 right-6 z-50 bg-accent hover:bg-accent/80 text-dark font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm',
            dialog: 'fixed bottom-6 right-6 z-50 w-80 bg-dark-50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
            label: 'hidden sm:inline'
        };
    }
    return {
        button: 'fixed bottom-4 right-3 sm:bottom-5 sm:right-4 z-50 bg-accent hover:bg-accent/80 text-dark font-semibold px-3.5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm',
        dialog: 'fixed bottom-4 right-3 sm:bottom-5 sm:right-4 z-50 w-[min(20rem,calc(100vw-1.5rem))] sm:w-80 bg-dark-50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
        label: 'hidden xl:inline'
    };
}
function FeedbackButton() {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [type, setType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('bug');
    const [desc, setDesc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [sending, setSending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [sent, setSent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])() ?? '/';
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const classes = getFeedbackButtonClasses(pathname);
    const submit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!desc.trim()) return;
        setSending(true);
        setError(null);
        try {
            const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$feedbackContext$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildFeedbackPayload"])(type, desc, {
                pathname,
                wallet: address ?? null,
                viewport: {
                    w: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 0,
                    h: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 0,
                    dpr: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 1
                },
                sessionId: getSessionId(),
                buildSha: getBuildSha(),
                recentConsole: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConsoleErrorCapture$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readConsoleBuffer"])()
            });
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                setError('Failed to submit. Please try again.');
                return;
            }
            setSent(true);
            setTimeout(()=>{
                setOpen(false);
                setSent(false);
                setDesc('');
                setType('bug');
            }, 2000);
        } catch  {
            setError('Network error. Please try again.');
        } finally{
            setSending(false);
        }
    }, [
        type,
        desc,
        pathname,
        address
    ]);
    if (!open) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: ()=>setOpen(true),
            className: classes.button,
            "aria-label": "Send feedback",
            "data-testid": "feedback-open",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: "💬"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                    lineNumber: 124,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: classes.label,
                    children: "Feedback"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
            lineNumber: 118,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "dialog",
        "aria-label": "Send feedback",
        className: classes.dialog,
        "data-testid": "feedback-dialog",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-3 border-b border-white/10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-white font-semibold text-sm",
                        children: "Send Feedback"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setOpen(false),
                        className: "text-gray-400 hover:text-white transition-colors",
                        "aria-label": "Close feedback",
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            sent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 text-center",
                "data-testid": "feedback-sent",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-accent text-lg font-semibold",
                        children: "Thanks! 🎉"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 151,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 text-sm mt-1",
                        children: "Your feedback has been recorded."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 152,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                lineNumber: 150,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2",
                        children: FEEDBACK_TYPES.map(({ value, label })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setType(value),
                                className: `text-xs px-3 py-1.5 rounded-full border transition-colors ${type === value ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`,
                                "data-testid": `feedback-type-${value}`,
                                children: label
                            }, value, false, {
                                fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                                lineNumber: 159,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 157,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        value: desc,
                        onChange: (e)=>setDesc(e.target.value),
                        placeholder: "Describe the issue or suggestion...",
                        rows: 4,
                        className: "w-full bg-dark border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 resize-none",
                        "data-testid": "feedback-description",
                        "aria-label": "Feedback description"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-xs",
                        role: "alert",
                        "data-testid": "feedback-error",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 186,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: submit,
                        disabled: !desc.trim() || sending,
                        className: "w-full bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-dark font-semibold py-2 rounded-lg text-sm transition-colors",
                        "data-testid": "feedback-submit",
                        children: sending ? 'Sending...' : 'Submit Feedback'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                        lineNumber: 192,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
                lineNumber: 155,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/FeedbackButton.tsx",
        lineNumber: 131,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0yt6tsw._.js.map