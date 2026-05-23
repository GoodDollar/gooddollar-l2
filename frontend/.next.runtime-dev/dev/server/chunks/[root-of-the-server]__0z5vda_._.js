module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

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
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiError",
    ()=>apiError,
    "methodNotAllowed",
    ()=>methodNotAllowed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function apiError(status, code, message, extra) {
    const { headers: extraHeaders, cacheControl, ...rest } = extra ?? {};
    const body = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
        ...rest
    };
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };
    if (cacheControl) {
        headers['Cache-Control'] = cacheControl;
    } else if (status >= 400) {
        headers['Cache-Control'] = 'no-store';
    }
    if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders)){
            headers[k] = v;
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
        status,
        headers
    });
}
function methodNotAllowed(req, allowed) {
    const url = new URL(req.url);
    const allowedUpper = allowed.map((m)=>m.toUpperCase());
    return apiError(405, 'method_not_allowed', 'Method not allowed', {
        path: url.pathname,
        method: req.method,
        allowed: allowedUpper,
        headers: {
            Allow: allowedUpper.join(', ')
        }
    });
}
}),
"[project]/op-stack/addresses.json.[json].cjs [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/frontend/src/lib/devnet.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/op-stack/addresses.json.[json].cjs [app-route] (ecmascript)");
;
const DEVNET_CHAIN_ID = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].chain_id;
const DEVNET_RPC_URL = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].rpc_url;
const DEVNET_EXPLORER_URL = __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].explorer_url;
const CONTRACTS = {
    // ── Core (from op-stack/addresses.json) ──────────────────────────────────
    GoodDollarToken: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.GoodDollarToken,
    UBIClaimV2: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.UBIClaimV2,
    UBIFeeSplitter: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.UBIFeeSplitter,
    LiFiBridgeAggregator: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.LiFiBridgeAggregator,
    ValidatorStaking: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.ValidatorStaking,
    UBIFeeHook: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.UBIFeeHook,
    MarketFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.MarketFactory,
    // ConditionalTokens: in JSON but currently no code on-chain after re-snapshot;
    // surfaced via JSON so the next refresh-addresses run picks up a redeploy.
    ConditionalTokens: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.ConditionalTokens,
    OptimisticResolver: "0x7c8baafa542c57ff9b2b90612bf8ab9e86e22c09",
    // ── GoodLend — sourced from op-stack/addresses.json (chain 42069) ────────
    // Previous hardcoded GoodLendPool (0x49fd…) was wiped by chain re-snapshot.
    GoodLendPool: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.GoodLendPool,
    GoodLendPriceOracle: "0x9d4454b023096f34b160d6b654540c56a1f81688",
    GoodLendInterestRateModel: "0x809d550fca64d94bd9f66e60752a544199cfac3d",
    // GoodLend reserve tokens — JSON-tracked
    MockUSDC: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.MockUSDC,
    MockWETH: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.MockWETH,
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
    PerpEngine: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.PerpEngine,
    MarginVault: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.MarginVault,
    FundingRate: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.FundingRate,
    PerpPriceOracle: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.PerpPriceOracle,
    // ── GoodStocks — sourced from op-stack/addresses.json (chain 42069) ──────
    // CollateralVault and SyntheticAssetFactory now live in the JSON; only the
    // sToken ERC-20s are still hardcoded and need a redeploy.
    StocksPriceOracle: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.StocksPriceOracle,
    CollateralVault: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.CollateralVault,
    SyntheticAssetFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.SyntheticAssetFactory,
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
    VoteEscrowedGD: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.VoteEscrowedGD,
    GoodDAO: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.GoodDAO,
    GoodTimelock: "0x5e6cb7e728e1c320855587e1d9c6f7972ebdd6d5",
    // ── GoodStable — sourced from op-stack/addresses.json (chain 42069) ──────
    // Previous hardcoded addresses (gUSD 0x5D42…, VaultManager 0xAb7b…, etc.)
    // were wiped by chain re-snapshot.
    gUSD: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.gUSD,
    VaultManager: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.VaultManager,
    CollateralRegistry: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.CollateralRegistry,
    StabilityPool: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.StabilityPool,
    PegStabilityModule: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.PegStabilityModule,
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
    UBIRevenueTracker: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.UBIRevenueTracker,
    // ── GoodYield — sourced from op-stack/addresses.json (chain 42069) ───────
    VaultFactory: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.VaultFactory,
    // ── GoodYield Initial Vaults — live after reset ──
    ETHLendingVault: "0xE5b9c837CF35ad00937CE3B553A1F13807EAC8f4",
    GUSDStabilityVault: "0xa327526e816a9f9958C2C1A936BEcC4675CACC4b",
    GDLendingVault: "0x8dB9B84E12FF48cC14B5ECE688e95A0597fA42B8",
    // ── Agent Registry — sourced from op-stack/addresses.json ────────────────
    AgentRegistry: __TURBOPACK__imported__module__$5b$project$5d2f$op$2d$stack$2f$addresses$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].contracts.AgentRegistry,
    // ── QA TestRegistry — live after reset ───────────────────────────────────
    TestRegistry: "0x0a17fabea4633ce714f1fa4a2dca62c3bac4758d"
};
const DEVNET_CONTRACTS = CONTRACTS;
;
}),
"[project]/frontend/src/app/api/rpc/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-route] (ecmascript) <locals>");
;
;
;
const runtime = 'nodejs';
const TIMEOUT_MS = 8_000;
async function handlePost(request) {
    let body;
    try {
        body = await request.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jsonrpc: '2.0',
            error: {
                code: -32700,
                message: 'Parse error'
            },
            id: null
        }, {
            status: 400
        });
    }
    if (!body || typeof body !== 'object') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jsonrpc: '2.0',
            error: {
                code: -32600,
                message: 'Invalid Request'
            },
            id: null
        }, {
            status: 400
        });
    }
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);
    try {
        const upstream = await fetch(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_RPC_URL"], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: ctrl.signal
        });
        const data = await upstream.text();
        return new Response(data, {
            status: upstream.status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    } catch (err) {
        const message = err instanceof Error && err.name === 'AbortError' ? 'Upstream RPC timeout' : 'Upstream RPC unreachable';
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message
            },
            id: null
        }, {
            status: 502
        });
    } finally{
        clearTimeout(timer);
    }
}
const POST = handlePost;
// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = [
    'POST'
];
const reject = (req)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["methodNotAllowed"])(req, [
        ...ALLOWED
    ]);
const GET = reject;
const PUT = reject;
const DELETE = reject;
const PATCH = reject;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0z5vda_._.js.map