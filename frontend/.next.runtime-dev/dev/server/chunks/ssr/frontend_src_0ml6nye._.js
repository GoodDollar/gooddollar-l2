module.exports = [
"[project]/frontend/src/components/AddNetworkButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AddNetworkButton",
    ()=>AddNetworkButton,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
// Read window.ethereum through a narrow accessor instead of `declare global`.
// `cbw-sdk` (a transitive dep of @coinbase/wallet-sdk) already declares
// `Window.ethereum?: any`, and re-declaring it with a stricter type triggers
// TS2717 ("subsequent property declarations must have the same type"). The
// accessor keeps our call sites type-safe without fighting the global.
function getInjectedEthereum() {
    if ("TURBOPACK compile-time truthy", 1) return undefined;
    //TURBOPACK unreachable
    ;
    const w = undefined;
}
function buildParams() {
    return [
        {
            chainId: `0x${__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_CHAIN_ID"].toString(16)}`,
            chainName: 'GoodChain Testnet',
            rpcUrls: [
                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_RPC_URL"]
            ],
            blockExplorerUrls: [
                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_EXPLORER_URL"]
            ],
            nativeCurrency: {
                name: 'GoodDollar',
                symbol: 'G$',
                decimals: 18
            },
            iconUrls: [
                '/icons/g-dollar-coin.svg'
            ]
        }
    ];
}
function AddNetworkButton({ variant = 'default', successCta, className = '' }) {
    // Detect wallet only on the client; SSR has no window.
    const [hasWallet, setHasWallet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [errorMsg, setErrorMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const detected = typeof getInjectedEthereum() !== 'undefined';
        setHasWallet(detected);
        if (!detected) setState('no-wallet');
    }, []);
    const handleClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const eth = getInjectedEthereum();
        if (!eth) {
            setState('no-wallet');
            return;
        }
        setState('pending');
        setErrorMsg('');
        try {
            await eth.request({
                method: 'wallet_addEthereumChain',
                params: buildParams()
            });
            setState('success');
        } catch (err) {
            const code = err?.code;
            if (code === 4001) {
                setState('rejected');
                return;
            }
            const msg = err instanceof Error ? err.message : 'Unknown wallet error';
            // Always log the raw error to the console for debugging.
            // eslint-disable-next-line no-console
            console.error('[add-network] wallet_addEthereumChain failed:', err);
            setErrorMsg(msg);
            setState('error');
        }
    }, []);
    if (state === 'no-wallet' || !hasWallet) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "status",
            "aria-live": "polite",
            className: `flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ${className}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "font-medium",
                    children: "No EVM wallet detected."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                    lineNumber: 126,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "https://metamask.io/download/",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-amber-300 underline hover:text-amber-100",
                    children: "Install MetaMask →"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
            lineNumber: 121,
            columnNumber: 7
        }, this);
    }
    const compact = variant === 'compact';
    const buttonLabel = compact ? 'Add GoodChain Testnet' : 'Add GoodChain Testnet to Wallet';
    const buttonClass = compact ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors' : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-base font-semibold text-dark hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-dark';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleClick,
                disabled: state === 'pending',
                "aria-busy": state === 'pending',
                className: buttonClass,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: compact ? 'text-sm' : 'text-lg',
                        children: "🟢"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    state === 'pending' ? 'Asking your wallet…' : buttonLabel
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                role: "status",
                "aria-live": "polite",
                className: `mt-2 text-xs ${state === 'success' ? 'text-emerald-300' : state === 'rejected' ? 'text-amber-300' : state === 'error' ? 'text-red-300' : 'text-transparent select-none'}`,
                children: [
                    state === 'success' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "✓ GoodChain Testnet added to your wallet",
                            successCta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    ' — ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: successCta.href,
                                        className: "underline hover:text-emerald-200",
                                        children: successCta.label
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                                        lineNumber: 181,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this),
                    state === 'rejected' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "You declined the request — click the button to retry."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                        lineNumber: 192,
                        columnNumber: 11
                    }, this),
                    state === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "Could not add the network: ",
                            errorMsg || 'unknown wallet error',
                            "."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this),
                    state !== 'success' && state !== 'rejected' && state !== 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: " "
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
                lineNumber: 162,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/AddNetworkButton.tsx",
        lineNumber: 149,
        columnNumber: 5
    }, this);
}
const __TURBOPACK__default__export__ = AddNetworkButton;
}),
"[project]/frontend/src/lib/links.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Canonical external links for the GoodDollar L2 frontend.
 *
 * Centralises URLs that point outside the running app (GitHub repo,
 * canonical doc files, issue tracker) so they cannot drift between pages.
 *
 * `GITHUB_REPO_URL` matches `git remote get-url origin` for this repo
 * (less the `.git` suffix, which browsers do not want).
 */ __turbopack_context__.s([
    "GITHUB_LINKS",
    ()=>GITHUB_LINKS,
    "GITHUB_REPO_URL",
    ()=>GITHUB_REPO_URL
]);
const GITHUB_REPO_URL = 'https://github.com/GoodDollar/gooddollar-l2';
const GITHUB_BLOB_MAIN = `${GITHUB_REPO_URL}/blob/main`;
const GITHUB_LINKS = {
    repo: GITHUB_REPO_URL,
    addressesJson: `${GITHUB_BLOB_MAIN}/op-stack/addresses.json`,
    architectureDoc: `${GITHUB_BLOB_MAIN}/docs/ARCHITECTURE.md`,
    testnetReadme: `${GITHUB_BLOB_MAIN}/docs/TESTNET_README.md`,
    newTestnetIssue: `${GITHUB_REPO_URL}/issues/new?labels=testnet-feedback`
};
}),
"[project]/frontend/src/app/(app)/testnet-guide/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TestnetGuidePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$AddNetworkButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/AddNetworkButton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$links$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/links.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const TOC = [
    {
        id: 'prerequisites',
        label: 'Prerequisites'
    },
    {
        id: 'add-network',
        label: 'Add GoodChain Testnet'
    },
    {
        id: 'get-tokens',
        label: 'Get Test G$'
    },
    {
        id: 'for-developers',
        label: 'For Developers'
    },
    {
        id: 'scenario-1',
        label: 'Scenario 1: First Swap'
    },
    {
        id: 'scenario-2',
        label: 'Scenario 2: Perps Position'
    },
    {
        id: 'scenario-3',
        label: 'Scenario 3: Prediction Market'
    },
    {
        id: 'scenario-4',
        label: 'Scenario 4: Lend & Borrow'
    },
    {
        id: 'scenario-5',
        label: 'Scenario 5: Mint gUSD'
    },
    {
        id: 'troubleshooting',
        label: 'Troubleshooting'
    },
    {
        id: 'feedback',
        label: 'Feedback'
    }
];
function CopyableCommand({ label, cmd }) {
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function onCopy() {
        try {
            await navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(()=>setCopied(false), 1500);
        } catch  {
        // Clipboard access denied (e.g. HTTP context). Silent — the
        // command is still visible/selectable in the <pre>.
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-50 border border-white/10 rounded-lg overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-400 font-medium",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onCopy,
                        "aria-label": `Copy command: ${label}`,
                        "data-testid": "copyable-command-copy",
                        className: "text-xs text-accent hover:text-white transition-colors px-2 py-0.5 rounded border border-accent/30 hover:bg-accent/10",
                        children: copied ? 'Copied ✓' : 'Copy'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                className: "px-3 py-3 text-xs text-gray-200 font-mono overflow-x-auto whitespace-pre-wrap break-all",
                children: cmd
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
function Badge({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-block bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full",
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
function StepList({ steps }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
        className: "list-decimal list-inside space-y-2 text-gray-300 ml-2",
        children: steps.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "leading-relaxed",
                children: s
            }, i, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
function VerifyBox({ items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-accent/5 border border-accent/20 rounded-lg p-4 mt-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-accent text-sm font-semibold mb-2",
                children: "✓ What to verify"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "list-disc list-inside space-y-1 text-gray-400 text-sm",
                children: items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: item
                    }, i, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
function ExpectedBox({ items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mt-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-emerald-400 text-sm font-semibold mb-2",
                children: "Expected outcome"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "list-disc list-inside space-y-1 text-gray-400 text-sm",
                children: items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: item
                    }, i, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 89,
        columnNumber: 5
    }, this);
}
function NetworkTable() {
    const rows = [
        [
            'Network Name',
            'GoodChain Testnet'
        ],
        [
            'RPC URL',
            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_RPC_URL"]
        ],
        [
            'Chain ID',
            String(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_CHAIN_ID"])
        ],
        [
            'Currency',
            'G$ (GoodDollar)'
        ],
        [
            'Explorer',
            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_EXPLORER_URL"]
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-sm border border-white/10 rounded-lg overflow-hidden",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                children: rows.map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "border-b border-white/5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-2 text-gray-400 font-medium bg-white/[0.02]",
                                children: k
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 114,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-2 text-white font-mono text-sm",
                                children: v
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 115,
                                columnNumber: 15
                            }, this)
                        ]
                    }, k, true, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 113,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 111,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
            lineNumber: 110,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
function ScenarioCard({ id, number, title, goal, steps, expected, verify, extra }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: id,
        className: "scroll-mt-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen(!open),
                className: "w-full flex items-center gap-3 text-left group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 text-accent text-sm font-bold flex items-center justify-center",
                        children: number
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-bold text-white group-hover:text-accent transition-colors",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-auto text-gray-500 text-sm",
                        children: open ? '▾' : '▸'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 156,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ml-11 mt-3 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 italic",
                        children: goal
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500 uppercase tracking-wide mb-2 font-semibold",
                                children: "Steps"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 162,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepList, {
                                steps: steps
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ExpectedBox, {
                        items: expected
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 165,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(VerifyBox, {
                        items: verify
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this),
                    extra
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 159,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, this);
}
function TestnetGuidePage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen pb-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-b border-white/10 bg-dark-50/50 backdrop-blur-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-4xl mx-auto px-4 py-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                            children: "Alpha Testnet"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                            lineNumber: 180,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl sm:text-4xl font-bold text-white mt-3",
                            children: "GoodDollar L2 Testnet Guide"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                            lineNumber: 181,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 mt-2 max-w-2xl",
                            children: "Everything you need to connect, get test tokens, and try all 6 DeFi protocols. Follow the 5 guided scenarios below to explore the full platform."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                            lineNumber: 184,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                    lineNumber: 179,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 178,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "lg:w-56 flex-shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:sticky lg:top-20 bg-dark-50 rounded-xl p-4 space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2",
                                    children: "Contents"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                    lineNumber: 195,
                                    columnNumber: 13
                                }, this),
                                TOC.map(({ id, label })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: `#${id}`,
                                        className: "block text-sm text-gray-400 hover:text-accent py-1 transition-colors",
                                        children: label
                                    }, id, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 197,
                                        columnNumber: 15
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                            lineNumber: 194,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 space-y-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "prerequisites",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "Prerequisites"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 212,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "list-disc list-inside text-gray-300 space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "MetaMask"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 214,
                                                        columnNumber: 19
                                                    }, this),
                                                    " (or any EVM-compatible wallet)"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 214,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: "A desktop browser (Chrome, Firefox, or Brave recommended)"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 215,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 213,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "add-network",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "1. Add GoodChain Testnet"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 221,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-5",
                                        "data-testid": "add-network-button-container",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$AddNetworkButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AddNetworkButton"], {
                                                successCta: {
                                                    label: 'Open Faucet →',
                                                    href: '/faucet'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 223,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500 mt-2",
                                                children: "One click adds the network to MetaMask (or any EIP-1193 wallet) using the canonical values below."
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 226,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 222,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NetworkTable, {}, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 231,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-500 uppercase tracking-wide mb-2 font-semibold",
                                                children: "Or add it manually"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 233,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepList, {
                                                steps: [
                                                    'Open MetaMask → Settings → Networks → Add Network',
                                                    'Enter the network details from the table above',
                                                    'Click Save — the network appears in your network selector'
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 236,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 232,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 220,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "get-tokens",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "2. Get Test G$"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 246,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-300 mb-3",
                                        children: [
                                            "Visit the ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                className: "text-accent",
                                                children: "Faucet"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 248,
                                                columnNumber: 25
                                            }, this),
                                            " page to claim free test tokens:"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 247,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StepList, {
                                        steps: [
                                            'Navigate to the Faucet page in the app',
                                            'Connect your wallet',
                                            'Click "Claim Test Tokens"',
                                            'You\'ll receive 10,000 G$ and 1 WETH'
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 250,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 245,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "for-developers",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "For developers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 260,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-300 mb-4",
                                        children: "Verify the public RPC and look up canonical addresses without leaving the docs. Everything below points to the same registry the frontend uses at runtime."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 261,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyableCommand, {
                                        label: "Test the public RPC",
                                        cmd: `curl -sX POST ${__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_RPC_URL"]} -H 'content-type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 265,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "list-disc list-inside text-gray-300 space-y-2 mt-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    "Canonical contract addresses:",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        className: "text-accent underline hover:text-white",
                                                        href: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$links$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GITHUB_LINKS"].addressesJson,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        "data-testid": "dev-link-addresses",
                                                        children: "op-stack/addresses.json →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 272,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500",
                                                        children: "(single source of truth for the frontend, backend, and cast scripts)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 281,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 270,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    "System architecture & protocol topology:",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        className: "text-accent underline hover:text-white",
                                                        href: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$links$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GITHUB_LINKS"].architectureDoc,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        "data-testid": "dev-link-architecture",
                                                        children: "docs/ARCHITECTURE.md →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 285,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    "GitHub-facing testnet entry point:",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        className: "text-accent underline hover:text-white",
                                                        href: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$links$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GITHUB_LINKS"].testnetReadme,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        "data-testid": "dev-link-testnet-readme",
                                                        children: "docs/TESTNET_README.md →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 299,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 297,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    "Lane 6 release proof page:",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        className: "text-accent underline hover:text-white",
                                                        href: "/live-prices-proof",
                                                        "data-testid": "dev-link-live-prices-proof",
                                                        prefetch: false,
                                                        children: "/live-prices-proof →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 311,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500",
                                                        children: "(live eToro quotes, on-chain oracle reads, recent tx hashes, last demo hedge)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 309,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 269,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t border-white/10 pt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white",
                                        children: "Guided Test Scenarios"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 328,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-400 mt-1",
                                        children: "Follow these 5 scenarios to test every protocol."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 329,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 327,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScenarioCard, {
                                id: "scenario-1",
                                number: 1,
                                title: "First Swap (WETH → G$)",
                                goal: "Execute your first token swap on GoodSwap.",
                                steps: [
                                    'Navigate to Swap (top nav)',
                                    'Select WETH as the input token',
                                    'Enter 0.1 WETH',
                                    'Select G$ as the output token',
                                    'Click Swap and confirm in MetaMask'
                                ],
                                expected: [
                                    'Your WETH balance decreases by 0.1',
                                    'Your G$ balance increases (amount shown in preview)',
                                    'A success toast appears with the transaction hash',
                                    'UBI fee counter on the UBI Impact page increments'
                                ],
                                verify: [
                                    'Check the transaction on the explorer',
                                    'Verify the UBI fee was routed (33% of swap fee → UBI)'
                                ]
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 333,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScenarioCard, {
                                id: "scenario-2",
                                number: 2,
                                title: "Open a Perps Position (Long BTC)",
                                goal: "Deposit margin and open a leveraged BTC long position.",
                                steps: [
                                    'Navigate to Perps',
                                    'Click Deposit Margin',
                                    'Enter 1000 G$ and confirm',
                                    'Select the BTC/USD market',
                                    'Choose Long, set leverage to 2x',
                                    'Enter position size: 500 G$',
                                    'Click Open Position and confirm'
                                ],
                                expected: [
                                    'Margin account shows 1000 G$ deposited',
                                    'An open position appears: BTC Long, 2x leverage, 500 G$ size',
                                    'Entry price matches the current oracle price',
                                    'Funding rate is displayed'
                                ],
                                verify: [
                                    'Position details match your inputs',
                                    'Wait 1 minute — verify funding accrues',
                                    'Close the position and verify PnL calculation'
                                ]
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 358,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScenarioCard, {
                                id: "scenario-3",
                                number: 3,
                                title: "Create a Prediction Market",
                                goal: "Create a binary prediction market and place a bet.",
                                steps: [
                                    'Navigate to Predict',
                                    'Click Create Market',
                                    'Enter question: "Will ETH be above $4000 by end of month?"',
                                    'Set end date to 7 days from now',
                                    'Deposit 100 G$ as initial collateral',
                                    'Confirm market creation'
                                ],
                                expected: [
                                    'A new market card appears on the Predict page',
                                    'Market shows your question, end date, and initial odds (50/50)'
                                ],
                                verify: [
                                    'G$ balance decreased by 100',
                                    'Choose YES on the market and bet 50 G$',
                                    'Market odds shift from 50/50 after your bet'
                                ]
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 386,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScenarioCard, {
                                id: "scenario-4",
                                number: 4,
                                title: "Supply to GoodLend & Borrow",
                                goal: "Supply G$ to earn interest, then borrow WETH against your collateral.",
                                steps: [
                                    'Navigate to Lend',
                                    'Click Supply on the G$ market',
                                    'Enter 5000 G$ and confirm',
                                    'You receive gGD tokens (receipt tokens)',
                                    'Click Borrow on the WETH market',
                                    'Enter 0.1 WETH and confirm'
                                ],
                                expected: [
                                    'Supply appears in dashboard with APY (e.g., 3.8%)',
                                    'WETH borrow appears with borrow APY',
                                    'Health factor shown (should be > 1.5)'
                                ],
                                verify: [
                                    'gGD token balance matches your supply',
                                    'Borrow limit reflects your collateral value',
                                    'After 1 block, interest accrues on supply and borrow'
                                ]
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 411,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScenarioCard, {
                                id: "scenario-5",
                                number: 5,
                                title: "Mint GoodStable (gUSD)",
                                goal: "Deposit collateral and mint the stablecoin gUSD.",
                                steps: [
                                    'Navigate to Stable',
                                    'Click Mint gUSD',
                                    'Select WETH as collateral',
                                    'Enter 0.5 WETH',
                                    'Review the mint amount (~750 gUSD at 150% ratio)',
                                    'Click Mint and confirm'
                                ],
                                expected: [
                                    'WETH balance decreases by 0.5',
                                    'gUSD balance increases',
                                    'A vault position shows your collateral ratio (≥ 150%)'
                                ],
                                verify: [
                                    'Vault details page shows correct collateral and debt',
                                    'Try repaying some gUSD to reduce your debt',
                                    'Collateral ratio updates in real time'
                                ]
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 437,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "troubleshooting",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "Troubleshooting"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 464,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-4",
                                        children: [
                                            {
                                                q: '"Transaction reverted" error',
                                                a: 'Ensure you have enough G$ for the transaction + gas. Check token approvals are set. Try refreshing and reconnecting.'
                                            },
                                            {
                                                q: 'Wallet not connecting',
                                                a: 'Verify you\'re on GoodChain Testnet (chain ID 42069). Try disconnecting and reconnecting. Clear MetaMask cache: Settings → Advanced → Reset Account.'
                                            },
                                            {
                                                q: 'Prices showing $0 or stale',
                                                a: 'The oracle keeper may be syncing — wait 30 seconds and refresh. Check the Status page to verify oracle services are running.'
                                            },
                                            {
                                                q: '"Insufficient balance" error',
                                                a: 'Visit the Faucet page to claim more test tokens. Some protocols require approval transactions first.'
                                            }
                                        ].map(({ q, a })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-dark-50 rounded-lg p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-white font-medium",
                                                        children: q
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 485,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-gray-400 text-sm mt-1",
                                                        children: a
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                        lineNumber: 486,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, q, true, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 484,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 465,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 463,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                id: "feedback",
                                className: "scroll-mt-20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-white mb-4",
                                        children: "Feedback"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 494,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-300",
                                        children: [
                                            "Found a bug or have a suggestion? Use the",
                                            ' ',
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                className: "text-accent",
                                                children: "Feedback"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 497,
                                                columnNumber: 15
                                            }, this),
                                            " button in the bottom-right corner of every page, or",
                                            ' ',
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                className: "text-accent underline hover:text-white",
                                                href: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$links$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GITHUB_LINKS"].newTestnetIssue,
                                                target: "_blank",
                                                rel: "noopener noreferrer",
                                                "data-testid": "feedback-github-link",
                                                children: "open an issue on GitHub →"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                                lineNumber: 499,
                                                columnNumber: 15
                                            }, this),
                                            "."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 495,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-400 text-sm mt-3",
                                        children: "Thank you for testing GoodDollar L2! Your feedback directly shapes the protocol."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                                lineNumber: 493,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/testnet-guide/page.tsx",
        lineNumber: 176,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0ml6nye._.js.map