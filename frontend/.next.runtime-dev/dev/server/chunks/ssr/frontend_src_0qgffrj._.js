module.exports = [
"[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * stockData.ts — Types and formatting utilities for GoodStocks.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainStocks() for stock listings + prices
 *   - useOnChainHoldings() for portfolio positions
 *   - useStockPrices() for live oracle prices
 *
 * This file retains types and formatting functions used by components.
 */ // ─── Types ────────────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "DEFAULT_STOCK_SPREAD_BPS",
    ()=>DEFAULT_STOCK_SPREAD_BPS,
    "MAX_STOCK_ORDER_USD",
    ()=>MAX_STOCK_ORDER_USD,
    "formatLargeCount",
    ()=>formatLargeCount,
    "formatLargeNumber",
    ()=>formatLargeNumber,
    "formatStockPrice",
    ()=>formatStockPrice,
    "formatStockShares",
    ()=>formatStockShares,
    "getAllTickers",
    ()=>getAllTickers,
    "getPortfolioHoldings",
    ()=>getPortfolioHoldings,
    "getPortfolioSummary",
    ()=>getPortfolioSummary,
    "getStockByTicker",
    ()=>getStockByTicker,
    "getStockData",
    ()=>getStockData,
    "getStockFinancials",
    ()=>getStockFinancials,
    "getTradeHistory",
    ()=>getTradeHistory
]);
function formatStockPrice(price) {
    return `$${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
function _formatWithSuffix(n) {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toFixed(0);
}
function formatLargeNumber(n) {
    return `$${_formatWithSuffix(n)}`;
}
function formatLargeCount(n) {
    return _formatWithSuffix(n);
}
function formatStockShares(n) {
    if (!Number.isFinite(n)) return '0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${abs.toFixed(4)}`;
}
const DEFAULT_STOCK_SPREAD_BPS = 15;
const MAX_STOCK_ORDER_USD = 10_000_000;
// ─── Ticker list (for oracle reads) ──────────────────────────────────────────
const TICKERS = [
    'AAPL',
    'TSLA',
    'NVDA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'JPM',
    'V',
    'DIS',
    'NFLX',
    'AMD'
];
function getAllTickers() {
    return TICKERS;
}
const FINANCIALS_DATA = {
    AAPL: {
        nextEarningsDate: 'Jul 31, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 94.8e9,
                eps: 1.65,
                epsEstimate: 1.60
            },
            {
                quarter: 'Q1 2026',
                revenue: 124.3e9,
                eps: 2.40,
                epsEstimate: 2.35
            },
            {
                quarter: 'Q4 2025',
                revenue: 89.5e9,
                eps: 1.46,
                epsEstimate: 1.47
            },
            {
                quarter: 'Q3 2025',
                revenue: 85.8e9,
                eps: 1.40,
                epsEstimate: 1.35
            }
        ]
    },
    TSLA: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 25.7e9,
                eps: 0.85,
                epsEstimate: 0.78
            },
            {
                quarter: 'Q1 2026',
                revenue: 21.3e9,
                eps: 0.52,
                epsEstimate: 0.58
            },
            {
                quarter: 'Q4 2025',
                revenue: 25.2e9,
                eps: 0.73,
                epsEstimate: 0.71
            },
            {
                quarter: 'Q3 2025',
                revenue: 23.4e9,
                eps: 0.62,
                epsEstimate: 0.60
            }
        ]
    },
    NVDA: {
        nextEarningsDate: 'Aug 20, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 44.1e9,
                eps: 0.89,
                epsEstimate: 0.84
            },
            {
                quarter: 'Q1 2026',
                revenue: 39.3e9,
                eps: 0.78,
                epsEstimate: 0.74
            },
            {
                quarter: 'Q4 2025',
                revenue: 35.1e9,
                eps: 0.68,
                epsEstimate: 0.64
            },
            {
                quarter: 'Q3 2025',
                revenue: 30.0e9,
                eps: 0.58,
                epsEstimate: 0.57
            }
        ]
    },
    MSFT: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 65.6e9,
                eps: 3.30,
                epsEstimate: 3.22
            },
            {
                quarter: 'Q1 2026',
                revenue: 69.6e9,
                eps: 3.46,
                epsEstimate: 3.30
            },
            {
                quarter: 'Q4 2025',
                revenue: 62.0e9,
                eps: 3.05,
                epsEstimate: 2.98
            },
            {
                quarter: 'Q3 2025',
                revenue: 56.5e9,
                eps: 2.93,
                epsEstimate: 2.82
            }
        ]
    },
    META: {
        nextEarningsDate: 'Jul 23, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 42.3e9,
                eps: 6.20,
                epsEstimate: 5.95
            },
            {
                quarter: 'Q1 2026',
                revenue: 40.1e9,
                eps: 5.85,
                epsEstimate: 5.70
            },
            {
                quarter: 'Q4 2025',
                revenue: 40.1e9,
                eps: 5.33,
                epsEstimate: 5.25
            },
            {
                quarter: 'Q3 2025',
                revenue: 34.1e9,
                eps: 4.50,
                epsEstimate: 4.39
            }
        ]
    },
    AMZN: {
        nextEarningsDate: 'Jul 24, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 158.9e9,
                eps: 1.45,
                epsEstimate: 1.38
            },
            {
                quarter: 'Q1 2026',
                revenue: 155.7e9,
                eps: 1.36,
                epsEstimate: 1.29
            },
            {
                quarter: 'Q4 2025',
                revenue: 170.0e9,
                eps: 1.48,
                epsEstimate: 1.46
            },
            {
                quarter: 'Q3 2025',
                revenue: 143.1e9,
                eps: 1.14,
                epsEstimate: 1.12
            }
        ]
    }
};
function getStockFinancials(ticker) {
    return FINANCIALS_DATA[ticker] ?? null;
}
function getStockData() {
    return [];
}
function getStockByTicker(_ticker) {
    return undefined;
}
function getPortfolioHoldings() {
    return [];
}
function getTradeHistory() {
    return [];
}
function getPortfolioSummary() {
    return {
        totalValue: 0,
        totalCost: 0,
        totalCollateral: 0,
        totalRequired: 0,
        unrealizedPnl: 0,
        pnlPercent: 0,
        healthRatio: 0
    };
}
}),
"[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CollateralRegistryABI",
    ()=>CollateralRegistryABI,
    "CollateralVaultABI",
    ()=>CollateralVaultABI,
    "ConditionalTokensABI",
    ()=>ConditionalTokensABI,
    "ERC20ABI",
    ()=>ERC20ABI,
    "FundingRateABI",
    ()=>FundingRateABI,
    "GoodDAOABI",
    ()=>GoodDAOABI,
    "GoodDollarTokenABI",
    ()=>GoodDollarTokenABI,
    "GoodLendPoolABI",
    ()=>GoodLendPoolABI,
    "GoodLendPriceOracleABI",
    ()=>GoodLendPriceOracleABI,
    "GoodPoolABI",
    ()=>GoodPoolABI,
    "GoodSwapRouterABI",
    ()=>GoodSwapRouterABI,
    "GoodVaultABI",
    ()=>GoodVaultABI,
    "MarginVaultABI",
    ()=>MarginVaultABI,
    "MarketFactoryABI",
    ()=>MarketFactoryABI,
    "PerpEngineABI",
    ()=>PerpEngineABI,
    "PriceOracleABI",
    ()=>PriceOracleABI,
    "SyntheticAssetFactoryABI",
    ()=>SyntheticAssetFactoryABI,
    "TestRegistryABI",
    ()=>TestRegistryABI,
    "UBIFeeHookABI",
    ()=>UBIFeeHookABI,
    "UBIRevenueTrackerABI",
    ()=>UBIRevenueTrackerABI,
    "VaultFactoryABI",
    ()=>VaultFactoryABI,
    "VaultManagerABI",
    ()=>VaultManagerABI,
    "VoteEscrowedGDABI",
    ()=>VoteEscrowedGDABI
]);
const GoodDollarTokenABI = [
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'name',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'spender',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'approve',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'transfer',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        name: 'allowance',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const MarketFactoryABI = [
    {
        inputs: [
            {
                name: 'question',
                type: 'string'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'resolver',
                type: 'address'
            }
        ],
        name: 'createMarket',
        outputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'isYES',
                type: 'bool'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'buy',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'redeem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'getMarket',
        outputs: [
            {
                name: 'question',
                type: 'string'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'status',
                type: 'uint8'
            },
            {
                name: 'totalYES',
                type: 'uint256'
            },
            {
                name: 'totalNO',
                type: 'uint256'
            },
            {
                name: 'collateral',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'marketCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'impliedProbabilityYES',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Events — required for client-side viem.getLogs(...) volume rollups
    // (task 0049: 24h volume + momentum delta on cards).
    {
        type: 'event',
        name: 'MarketCreated',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'question',
                type: 'string'
            },
            {
                indexed: false,
                name: 'endTime',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'resolver',
                type: 'address'
            }
        ]
    },
    {
        type: 'event',
        name: 'Bought',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'buyer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'isYES',
                type: 'bool'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'cost',
                type: 'uint256'
            }
        ]
    },
    {
        type: 'event',
        name: 'Redeemed',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'redeemer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'payout',
                type: 'uint256'
            }
        ]
    }
];
const ConditionalTokensABI = [
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'yesTokenId',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'pure',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'noTokenId',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'pure',
        type: 'function'
    }
];
const UBIFeeHookABI = [
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'calculateUBIFee',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'ubiFeeShareBPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSwapsProcessed',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'token',
                type: 'address'
            }
        ],
        name: 'totalUBIFees',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodLendPoolABI = [
    // supply
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // withdraw
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdraw',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // borrow
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'borrow',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // repay
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'repay',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // liquidate
    {
        inputs: [
            {
                name: 'collateralAsset',
                type: 'address'
            },
            {
                name: 'debtAsset',
                type: 'address'
            },
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'debtToCover',
                type: 'uint256'
            }
        ],
        name: 'liquidate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // getUserAccountData
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            }
        ],
        name: 'getUserAccountData',
        outputs: [
            {
                name: 'healthFactor',
                type: 'uint256'
            },
            {
                name: 'totalCollateralUSD',
                type: 'uint256'
            },
            {
                name: 'totalDebtUSD',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // getReserveData
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'getReserveData',
        outputs: [
            {
                name: 'totalDeposits',
                type: 'uint256'
            },
            {
                name: 'totalBorrows',
                type: 'uint256'
            },
            {
                name: 'liquidityIndex',
                type: 'uint256'
            },
            {
                name: 'borrowIndex',
                type: 'uint256'
            },
            {
                name: 'supplyRate',
                type: 'uint256'
            },
            {
                name: 'borrowRate',
                type: 'uint256'
            },
            {
                name: 'accruedToTreasury',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // reserves mapping (public)
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'reserves',
        outputs: [
            {
                name: 'gToken',
                type: 'address'
            },
            {
                name: 'debtToken',
                type: 'address'
            },
            {
                name: 'reserveFactorBPS',
                type: 'uint256'
            },
            {
                name: 'ltvBPS',
                type: 'uint256'
            },
            {
                name: 'liquidationThresholdBPS',
                type: 'uint256'
            },
            {
                name: 'liquidationBonusBPS',
                type: 'uint256'
            },
            {
                name: 'supplyCap',
                type: 'uint256'
            },
            {
                name: 'borrowCap',
                type: 'uint256'
            },
            {
                name: 'decimals',
                type: 'uint8'
            },
            {
                name: 'isActive',
                type: 'bool'
            },
            {
                name: 'borrowingEnabled',
                type: 'bool'
            },
            {
                name: 'liquidityIndex',
                type: 'uint256'
            },
            {
                name: 'variableBorrowIndex',
                type: 'uint256'
            },
            {
                name: 'currentBorrowRate',
                type: 'uint256'
            },
            {
                name: 'currentSupplyRate',
                type: 'uint256'
            },
            {
                name: 'lastUpdateTimestamp',
                type: 'uint40'
            },
            {
                name: 'accruedToTreasury',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Events
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Supply',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Withdraw',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Borrow',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Repay',
        type: 'event'
    }
];
const PerpEngineABI = [
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'size',
                type: 'uint256'
            },
            {
                name: 'isLong',
                type: 'bool'
            },
            {
                name: 'margin',
                type: 'uint256'
            }
        ],
        name: 'openPosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'closePosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'markets',
        outputs: [
            {
                name: 'key',
                type: 'bytes32'
            },
            {
                name: 'maxLeverage',
                type: 'uint256'
            },
            {
                name: 'isActive',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'marketCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'positions',
        outputs: [
            {
                name: 'isOpen',
                type: 'bool'
            },
            {
                name: 'isLong',
                type: 'bool'
            },
            {
                name: 'size',
                type: 'uint256'
            },
            {
                name: 'entryPrice',
                type: 'uint256'
            },
            {
                name: 'margin',
                type: 'uint256'
            },
            {
                name: 'entryFundingIdx',
                type: 'int256'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'marginRatio',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'unrealizedPnL',
        outputs: [
            {
                name: '',
                type: 'int256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const CollateralVaultABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'depositCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'collateralAmount',
                type: 'uint256'
            },
            {
                name: 'syntheticAmount',
                type: 'uint256'
            }
        ],
        name: 'depositAndMint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'syntheticAmount',
                type: 'uint256'
            },
            {
                name: 'additionalCollateral',
                type: 'uint256'
            }
        ],
        name: 'getMintRequirements',
        outputs: [
            {
                name: 'requiredCollateral',
                type: 'uint256'
            },
            {
                name: 'fee',
                type: 'uint256'
            },
            {
                name: 'available',
                type: 'uint256'
            },
            {
                name: 'canMint',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdrawCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'mint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'burn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getPosition',
        outputs: [
            {
                name: 'userCollateral',
                type: 'uint256'
            },
            {
                name: 'userDebt',
                type: 'uint256'
            },
            {
                name: 'ratio',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getCollateralRatio',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        type: 'event',
        name: 'Minted',
        inputs: [
            {
                name: 'user',
                type: 'address',
                indexed: true
            },
            {
                name: 'ticker',
                type: 'bytes32',
                indexed: true
            },
            {
                name: 'syntheticAmount',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'collateralUsed',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'fee',
                type: 'uint256',
                indexed: false
            }
        ]
    },
    {
        type: 'event',
        name: 'Burned',
        inputs: [
            {
                name: 'user',
                type: 'address',
                indexed: true
            },
            {
                name: 'ticker',
                type: 'bytes32',
                indexed: true
            },
            {
                name: 'syntheticAmount',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'collateralReturned',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'fee',
                type: 'uint256',
                indexed: false
            }
        ]
    }
];
const SyntheticAssetFactoryABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getAsset',
        outputs: [
            {
                name: 'tokenAddress',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        name: 'keyToTicker',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'listedCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'index',
                type: 'uint256'
            }
        ],
        name: 'listedKeys',
        outputs: [
            {
                name: '',
                type: 'bytes32'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const MarginVaultABI = [
    {
        inputs: [],
        name: 'collateral',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            }
        ],
        name: 'balances',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const FundingRateABI = [
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'cumulativeFundingIndex',
        outputs: [
            {
                name: '',
                type: 'int256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'lastFundingTime',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'FUNDING_INTERVAL',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const ERC20ABI = [
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        name: 'allowance',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'spender',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'approve',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodLendPriceOracleABI = [
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'getAssetPrice',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const PriceOracleABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getPrice',
        outputs: [
            {
                name: 'price',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'hasFeed',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'maxAge',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const VaultManagerABI = [
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        name: 'vaults',
        outputs: [
            {
                name: 'collateral',
                type: 'uint256'
            },
            {
                name: 'normalizedDebt',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'accumulators',
        outputs: [
            {
                name: 'chi',
                type: 'uint256'
            },
            {
                name: 'lastDrip',
                type: 'uint256'
            },
            {
                name: 'totalNormalizedDebt',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        name: 'vaultDebt',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'openVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'depositCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdrawCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'mintGUSD',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'repayGUSD',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'closeVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
];
const CollateralRegistryABI = [
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'getConfig',
        outputs: [
            {
                components: [
                    {
                        name: 'token',
                        type: 'address'
                    },
                    {
                        name: 'liquidationRatio',
                        type: 'uint256'
                    },
                    {
                        name: 'liquidationPenalty',
                        type: 'uint256'
                    },
                    {
                        name: 'debtCeiling',
                        type: 'uint256'
                    },
                    {
                        name: 'stabilityFeeRate',
                        type: 'uint256'
                    },
                    {
                        name: 'active',
                        type: 'bool'
                    }
                ],
                name: '',
                type: 'tuple'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'ilkCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        name: 'ilkList',
        outputs: [
            {
                name: '',
                type: 'bytes32'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodPoolABI = [
    {
        inputs: [],
        name: 'tokenA',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'tokenB',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'reserveA',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'reserveB',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalLiquidity',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'liquidity',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'spotPrice',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        name: 'getAmountOut',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'minOut',
                type: 'uint256'
            }
        ],
        name: 'swap',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountA',
                type: 'uint256'
            },
            {
                name: 'amountB',
                type: 'uint256'
            }
        ],
        name: 'addLiquidity',
        outputs: [
            {
                name: 'lp',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'lpAmount',
                type: 'uint256'
            }
        ],
        name: 'removeLiquidity',
        outputs: [
            {
                name: 'outA',
                type: 'uint256'
            },
            {
                name: 'outB',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'trader',
                type: 'address'
            },
            {
                indexed: false,
                name: 'tokenIn',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amountIn',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'amountOut',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'fee',
                type: 'uint256'
            }
        ],
        name: 'Swap',
        type: 'event'
    }
];
const GoodSwapRouterABI = [
    {
        inputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getAmountOut',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            },
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getAmountIn',
        outputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getPool',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'amountOutMin',
                type: 'uint256'
            },
            {
                name: 'path',
                type: 'address[]'
            },
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'deadline',
                type: 'uint256'
            }
        ],
        name: 'swapExactTokensForTokens',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            },
            {
                name: 'amountInMax',
                type: 'uint256'
            },
            {
                name: 'path',
                type: 'address[]'
            },
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'deadline',
                type: 'uint256'
            }
        ],
        name: 'swapTokensForExactTokens',
        outputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'tokenIn',
                type: 'address'
            },
            {
                indexed: true,
                name: 'tokenOut',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amountIn',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'amountOut',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'to',
                type: 'address'
            }
        ],
        name: 'Swap',
        type: 'event'
    }
];
const VoteEscrowedGDABI = [
    {
        inputs: [
            {
                name: '_gd',
                type: 'address'
            },
            {
                name: '_ubiTreasury',
                type: 'address'
            },
            {
                name: '_admin',
                type: 'address'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            },
            {
                name: 'duration',
                type: 'uint256'
            }
        ],
        name: 'lock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'addedAmount',
                type: 'uint256'
            }
        ],
        name: 'increaseLock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'newEnd',
                type: 'uint256'
            }
        ],
        name: 'extendLock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'earlyUnlock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'delegatee',
                type: 'address'
            }
        ],
        name: 'delegate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'votingPowerOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'getVotes',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            },
            {
                name: 'timestamp',
                type: 'uint256'
            }
        ],
        name: 'getPastVotes',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalVotingPower',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalLocked',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'locks',
        outputs: [
            {
                name: 'amount',
                type: 'uint128'
            },
            {
                name: 'end',
                type: 'uint128'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'delegates',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'MAX_LOCK',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'MIN_LOCK',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'gd',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'name',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'unlockTime',
                type: 'uint256'
            }
        ],
        name: 'Locked',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'received',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'penalty',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'toUBI',
                type: 'uint256'
            }
        ],
        name: 'EarlyUnlocked',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Withdrawn',
        type: 'event'
    }
];
const GoodDAOABI = [
    {
        inputs: [
            {
                name: '_veGD',
                type: 'address'
            },
            {
                name: '_guardian',
                type: 'address'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        inputs: [
            {
                name: 'targets',
                type: 'address[]'
            },
            {
                name: 'values',
                type: 'uint256[]'
            },
            {
                name: 'calldatas',
                type: 'bytes[]'
            },
            {
                name: 'description',
                type: 'string'
            }
        ],
        name: 'propose',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            },
            {
                name: 'support',
                type: 'uint8'
            }
        ],
        name: 'castVote',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'queue',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'cancel',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'state',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'proposalCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        name: 'proposals',
        outputs: [
            {
                name: 'id',
                type: 'uint256'
            },
            {
                name: 'proposer',
                type: 'address'
            },
            {
                name: 'description',
                type: 'string'
            },
            {
                name: 'startTime',
                type: 'uint256'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'executionTime',
                type: 'uint256'
            },
            {
                name: 'forVotes',
                type: 'uint256'
            },
            {
                name: 'againstVotes',
                type: 'uint256'
            },
            {
                name: 'abstainVotes',
                type: 'uint256'
            },
            {
                name: 'canceled',
                type: 'bool'
            },
            {
                name: 'executed',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            },
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'receipts',
        outputs: [
            {
                name: 'hasVoted',
                type: 'bool'
            },
            {
                name: 'support',
                type: 'uint8'
            },
            {
                name: 'votes',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'veGD',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'guardian',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'VOTING_DELAY',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'VOTING_PERIOD',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'TIMELOCK_DELAY',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'PROPOSAL_THRESHOLD_BPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'QUORUM_BPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'proposer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'description',
                type: 'string'
            }
        ],
        name: 'ProposalCreated',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'voter',
                type: 'address'
            },
            {
                indexed: true,
                name: 'proposalId',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'support',
                type: 'uint8'
            },
            {
                indexed: false,
                name: 'votes',
                type: 'uint256'
            }
        ],
        name: 'VoteCast',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'executionTime',
                type: 'uint256'
            }
        ],
        name: 'ProposalQueued',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'ProposalExecuted',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'ProposalCanceled',
        type: 'event'
    }
];
const TestRegistryABI = [
    {
        type: 'function',
        name: 'getResultCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResult',
        inputs: [
            {
                name: 'resultId',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResults',
        inputs: [
            {
                name: 'from',
                type: 'uint256'
            },
            {
                name: 'to',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: 'results',
                type: 'tuple[]',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResultsByTester',
        inputs: [
            {
                name: 'tester',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'matches',
                type: 'tuple[]',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            },
            {
                name: 'ids',
                type: 'uint256[]'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'event',
        name: 'TestResultLogged',
        inputs: [
            {
                name: 'resultId',
                type: 'uint256',
                indexed: true
            },
            {
                name: 'tester',
                type: 'address',
                indexed: true
            },
            {
                name: 'contractTested',
                type: 'address',
                indexed: true
            },
            {
                name: 'functionSelector',
                type: 'bytes4',
                indexed: false
            },
            {
                name: 'success',
                type: 'bool',
                indexed: false
            },
            {
                name: 'gasUsed',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'timestamp',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'note',
                type: 'string',
                indexed: false
            }
        ],
        anonymous: false
    }
];
const UBIRevenueTrackerABI = [
    {
        type: 'function',
        name: 'getDashboardData',
        inputs: [],
        outputs: [
            {
                name: '_totalFees',
                type: 'uint256'
            },
            {
                name: '_totalUBI',
                type: 'uint256'
            },
            {
                name: '_totalTx',
                type: 'uint256'
            },
            {
                name: '_protocolCount',
                type: 'uint256'
            },
            {
                name: '_activeProtocols',
                type: 'uint256'
            },
            {
                name: '_splitterFees',
                type: 'uint256'
            },
            {
                name: '_splitterUBI',
                type: 'uint256'
            },
            {
                name: '_snapshotCount',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getAllProtocols',
        inputs: [],
        outputs: [
            {
                name: 'result',
                type: 'tuple[]',
                components: [
                    {
                        name: 'name',
                        type: 'string'
                    },
                    {
                        name: 'category',
                        type: 'string'
                    },
                    {
                        name: 'feeSource',
                        type: 'address'
                    },
                    {
                        name: 'totalFees',
                        type: 'uint256'
                    },
                    {
                        name: 'ubiContribution',
                        type: 'uint256'
                    },
                    {
                        name: 'txCount',
                        type: 'uint256'
                    },
                    {
                        name: 'lastUpdateBlock',
                        type: 'uint256'
                    },
                    {
                        name: 'active',
                        type: 'bool'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getSnapshots',
        inputs: [
            {
                name: 'count',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: 'result',
                type: 'tuple[]',
                components: [
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'totalUBI',
                        type: 'uint256'
                    },
                    {
                        name: 'totalFees',
                        type: 'uint256'
                    },
                    {
                        name: 'protocolCount',
                        type: 'uint256'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'protocolCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'snapshotCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalFeesTracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBITracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalTxTracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    }
];
const VaultFactoryABI = [
    {
        type: 'function',
        name: 'allVaults',
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'vaultCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalTVL',
        inputs: [],
        outputs: [
            {
                name: 'tvl',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBIFunded',
        inputs: [],
        outputs: [
            {
                name: 'total',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'isVault',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getVaultsByAsset',
        inputs: [
            {
                name: '_asset',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'address[]'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'approvedStrategies',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    }
];
const GoodVaultABI = [
    {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'asset',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalAssets',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'convertToShares',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'convertToAssets',
        inputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'maxDeposit',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'previewDeposit',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'previewWithdraw',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'deposit',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'withdraw',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'redeem',
        inputs: [
            {
                name: 'shares',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'harvest',
        inputs: [],
        outputs: [
            {
                name: 'profit',
                type: 'uint256'
            },
            {
                name: 'loss',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'strategy',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'depositCap',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalDebt',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'performanceFeeBPS',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'managementFeeBPS',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalGainSinceInception',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBIFunded',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'paused',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'lastReport',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    // ERC-20 approve (needed for deposit)
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    }
];
}),
"[project]/frontend/src/lib/useOnChainPredict.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOnChainMarkets",
    ()=>useOnChainMarkets,
    "useOnChainPredictPositions",
    ()=>useOnChainPredictPositions,
    "useOnChainPredictSummary",
    ()=>useOnChainPredictSummary
]);
/**
 * useOnChainPredict — reads prediction market data from on-chain MarketFactory.
 *
 * Replaces MOCK_MARKETS / MOCK_POSITIONS / MOCK_RESOLVED from predictData.ts
 * with real reads from MarketFactory.getMarket() and impliedProbabilityYES().
 *
 * Falls back to empty data when contracts are unavailable.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
// ─── Fallback demo prediction markets when on-chain data is unavailable ──────
const FALLBACK_MARKETS = [
    {
        id: 'demo-1',
        question: 'Will Bitcoin exceed $100,000 by end of 2025?',
        category: 'Crypto',
        yesPrice: 0.72,
        volume: 4_500_000,
        liquidity: 1_200_000,
        endDate: '2025-12-31',
        resolved: false,
        resolutionSource: 'CoinGecko spot price',
        createdAt: '2025-01-15',
        totalShares: 8_500_000
    },
    {
        id: 'demo-2',
        question: 'Will the US pass a stablecoin regulation bill by Q3 2025?',
        category: 'Politics',
        yesPrice: 0.58,
        volume: 2_100_000,
        liquidity: 680_000,
        endDate: '2025-09-30',
        resolved: false,
        resolutionSource: 'Congressional record',
        createdAt: '2025-02-01',
        totalShares: 3_200_000
    },
    {
        id: 'demo-3',
        question: 'Will OpenAI release GPT-5 before July 2025?',
        category: 'AI & Tech',
        yesPrice: 0.45,
        volume: 3_800_000,
        liquidity: 950_000,
        endDate: '2025-07-01',
        resolved: false,
        resolutionSource: 'OpenAI official announcement',
        createdAt: '2025-01-20',
        totalShares: 6_100_000
    },
    {
        id: 'demo-4',
        question: 'Will Ethereum ETF daily inflows exceed $1B in a single day in 2025?',
        category: 'Crypto',
        yesPrice: 0.38,
        volume: 1_750_000,
        liquidity: 520_000,
        endDate: '2025-12-31',
        resolved: false,
        resolutionSource: 'Bloomberg ETF data',
        createdAt: '2025-03-01',
        totalShares: 2_900_000
    },
    {
        id: 'demo-5',
        question: 'Will Real Madrid win the 2025 Champions League?',
        category: 'Sports',
        yesPrice: 0.31,
        volume: 6_200_000,
        liquidity: 1_800_000,
        endDate: '2025-06-01',
        resolved: false,
        resolutionSource: 'UEFA official results',
        createdAt: '2025-02-10',
        totalShares: 9_400_000
    },
    {
        id: 'demo-6',
        question: 'Will GoodDollar reach 1 million unique claimers by end of 2025?',
        category: 'Crypto',
        yesPrice: 0.62,
        volume: 890_000,
        liquidity: 310_000,
        endDate: '2025-12-31',
        resolved: false,
        resolutionSource: 'GoodDollar dashboard',
        createdAt: '2025-03-15',
        totalShares: 1_500_000
    }
];
const FACTORY = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarketFactory;
const COND_TOKENS = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].ConditionalTokens;
// ─── Infer category from question text ───────────────────────────────────────
function inferCategory(question) {
    const q = question.toLowerCase();
    if (q.includes('bitcoin') || q.includes('ethereum') || q.includes('crypto') || q.includes('gooddollar') || q.includes('etoro') || q.includes('etor')) return 'Crypto';
    if (q.includes('election') || q.includes('fed ') || q.includes('regulation') || q.includes('legislation') || q.includes('congress') || q.includes('stablecoin')) return 'Politics';
    if (q.includes('champion') || q.includes('nba') || q.includes('fifa') || q.includes('world cup') || q.includes('olympic')) return 'Sports';
    if (q.includes('ai ') || q.includes('agi') || q.includes('gpt') || q.includes('openai') || q.includes('nvidia') || q.includes('apple') || q.includes('agent')) return 'AI & Tech';
    if (q.includes('spacex') || q.includes('mars') || q.includes('climate') || q.includes('pandemic') || q.includes('who ')) return 'World Events';
    return 'Culture';
}
function useOnChainMarkets() {
    // Step 1: Get market count
    const { data: countData, isLoading: countLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: FACTORY,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
        functionName: 'marketCount',
        query: {
            refetchInterval: 30_000
        }
    });
    const marketCount = typeof countData === 'bigint' ? Number(countData) : 0;
    // Step 2: Batch-read all markets + probabilities
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (marketCount === 0) return [];
        const calls = [];
        for(let i = 0; i < marketCount; i++){
            const id = BigInt(i);
            calls.push({
                address: FACTORY,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
                functionName: 'getMarket',
                args: [
                    id
                ]
            });
            calls.push({
                address: FACTORY,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
                functionName: 'impliedProbabilityYES',
                args: [
                    id
                ]
            });
        }
        return calls;
    }, [
        marketCount
    ]);
    const { data: batchData, isLoading: batchLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000
        }
    });
    const markets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!batchData || batchData.length === 0) return [];
        const result = [];
        for(let i = 0; i < marketCount; i++){
            const marketResult = batchData[i * 2];
            const probResult = batchData[i * 2 + 1];
            if (marketResult?.status !== 'success' || !marketResult.result) continue;
            // getMarket returns: (question, endTime, status, totalYES, totalNO, collateral)
            const [question, endTime, status, totalYES, totalNO, collateral] = marketResult.result;
            const chainStatus = Number(status);
            const yesTokens = Number(totalYES) / 1e18;
            const noTokens = Number(totalNO) / 1e18;
            const totalCollateral = Number(collateral) / 1e18;
            // Implied probability from contract (basis points)
            let yesPrice = 0.5;
            if (probResult?.status === 'success' && typeof probResult.result === 'bigint') {
                yesPrice = Number(probResult.result) / 10000;
            }
            const endDate = new Date(Number(endTime) * 1000).toISOString().split('T')[0];
            const resolved = chainStatus === 2 || chainStatus === 3;
            const outcome = chainStatus === 2 ? 'yes' : chainStatus === 3 ? 'no' : undefined;
            result.push({
                id: String(i),
                question,
                category: inferCategory(question),
                yesPrice,
                volume: totalCollateral,
                liquidity: totalCollateral,
                endDate,
                resolved,
                outcome,
                resolutionSource: 'On-chain oracle / admin resolution',
                createdAt: endDate,
                totalShares: yesTokens + noTokens
            });
        }
        return result;
    }, [
        batchData,
        marketCount
    ]);
    const finalMarkets = markets.length > 0 ? markets : FALLBACK_MARKETS;
    return {
        markets: finalMarkets,
        isLoading: countLoading || batchLoading,
        isLive: markets.length > 0
    };
}
function useOnChainPredictPositions() {
    const { address, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    // Get market count
    const { data: countData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: FACTORY,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
        functionName: 'marketCount',
        query: {
            refetchInterval: 30_000
        }
    });
    const marketCount = typeof countData === 'bigint' ? Number(countData) : 0;
    // Read YES/NO token balances for each market + market data.
    // ConditionalTokens is ERC1155: balanceOf(owner, tokenId).
    // YES token ID = marketId * 2, NO token ID = marketId * 2 + 1.
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!isConnected || !address || marketCount === 0 || !COND_TOKENS) return [];
        const calls = [];
        for(let i = 0; i < marketCount; i++){
            const id = BigInt(i);
            const yesId = id * 2n // yesTokenId = marketId * 2
            ;
            const noId = id * 2n + 1n // noTokenId  = marketId * 2 + 1
            ;
            // YES balance
            calls.push({
                address: COND_TOKENS,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConditionalTokensABI"],
                functionName: 'balanceOf',
                args: [
                    address,
                    yesId
                ]
            });
            // NO balance
            calls.push({
                address: COND_TOKENS,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConditionalTokensABI"],
                functionName: 'balanceOf',
                args: [
                    address,
                    noId
                ]
            });
            // implied probability
            calls.push({
                address: FACTORY,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
                functionName: 'impliedProbabilityYES',
                args: [
                    id
                ]
            });
            // market status
            calls.push({
                address: FACTORY,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarketFactoryABI"],
                functionName: 'getMarket',
                args: [
                    id
                ]
            });
        }
        return calls;
    }, [
        address,
        isConnected,
        marketCount
    ]);
    const { data: batchData, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000
        }
    });
    const { positions, resolved } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const pos = [];
        const res = [];
        if (!batchData || batchData.length === 0) return {
            positions: pos,
            resolved: res
        };
        for(let i = 0; i < marketCount; i++){
            const yesResult = batchData[i * 4];
            const noResult = batchData[i * 4 + 1];
            const probResult = batchData[i * 4 + 2];
            const marketResult = batchData[i * 4 + 3];
            const yesBal = yesResult?.status === 'success' && typeof yesResult.result === 'bigint' ? Number(yesResult.result) / 1e18 : 0;
            const noBal = noResult?.status === 'success' && typeof noResult.result === 'bigint' ? Number(noResult.result) / 1e18 : 0;
            if (yesBal === 0 && noBal === 0) continue;
            let yesPrice = 0.5;
            if (probResult?.status === 'success' && typeof probResult.result === 'bigint') {
                yesPrice = Number(probResult.result) / 10000;
            }
            let chainStatus = 0;
            if (marketResult?.status === 'success' && marketResult.result) {
                const [, , status] = marketResult.result;
                chainStatus = Number(status);
            }
            const isResolved = chainStatus === 2 || chainStatus === 3;
            const outcome = chainStatus === 2 ? 'yes' : 'no';
            // Figure out dominant side
            const side = yesBal >= noBal ? 'yes' : 'no';
            const shares = side === 'yes' ? yesBal : noBal;
            if (isResolved) {
                const payout = outcome === side ? shares : 0;
                res.push({
                    marketId: String(i),
                    side: side,
                    shares,
                    avgPrice: 0.5,
                    outcome: outcome,
                    payout
                });
            } else {
                pos.push({
                    marketId: String(i),
                    side: side,
                    shares,
                    avgPrice: 0.5,
                    currentPrice: yesPrice
                });
            }
        }
        return {
            positions: pos,
            resolved: res
        };
    }, [
        batchData,
        marketCount
    ]);
    return {
        positions,
        resolved,
        isLoading
    };
}
function useOnChainPredictSummary() {
    const { positions } = useOnChainPredictPositions();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const totalInvested = positions.reduce((sum, p)=>sum + p.shares * p.avgPrice, 0);
        const currentValue = positions.reduce((sum, p)=>{
            const price = p.side === 'yes' ? p.currentPrice : 1 - p.currentPrice;
            return sum + p.shares * price;
        }, 0);
        const unrealizedPnl = currentValue - totalInvested;
        return {
            totalInvested,
            currentValue,
            unrealizedPnl,
            totalPositions: positions.length
        };
    }, [
        positions
    ]);
}
}),
"[project]/frontend/src/lib/perpsData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * perpsData.ts — Types and formatting utilities for GoodPerps.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainPairs() for perpetual market listings
 *   - useOnChainPositions() for open positions
 *   - useOnChainAccountSummary() for account balance/margin
 *   - usePerps hooks for trade execution
 *
 * This file retains types and formatting functions used by components.
 */ // ─── Types ────────────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "formatFundingRate",
    ()=>formatFundingRate,
    "formatLargeValue",
    ()=>formatLargeValue,
    "formatPerpsPrice",
    ()=>formatPerpsPrice,
    "getAccountSummary",
    ()=>getAccountSummary,
    "getFundingCountdown",
    ()=>getFundingCountdown,
    "getFundingPayments",
    ()=>getFundingPayments,
    "getLeaderboard",
    ()=>getLeaderboard,
    "getOpenPositions",
    ()=>getOpenPositions,
    "getPairBySymbol",
    ()=>getPairBySymbol,
    "getPairs",
    ()=>getPairs,
    "getPendingOrders",
    ()=>getPendingOrders,
    "getTradeHistory",
    ()=>getTradeHistory
]);
// ─── Formatting ───────────────────────────────────────────────────────────────
const PRICE_TIERS = [
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
function formatPerpsPrice(price) {
    if (price === 0) return '$0.00';
    const abs = Math.abs(price);
    const sign = price < 0 ? '-' : '';
    for (const [threshold, suffix] of PRICE_TIERS){
        if (abs >= threshold) {
            const abbr = abs / threshold;
            const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2;
            return `${sign}$${abbr.toFixed(decimals)}${suffix}`;
        }
    }
    if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
    if (abs >= 0.01) return `${sign}$${abs.toFixed(4)}`;
    return `${sign}$${abs.toFixed(6)}`;
}
function formatLargeValue(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of PRICE_TIERS){
        if (abs >= threshold) {
            const abbr = abs / threshold;
            const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2;
            return `${sign}$${abbr.toFixed(decimals)}${suffix}`;
        }
    }
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}
function formatFundingRate(rate) {
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
}
function getFundingCountdown(nextTime) {
    const diff = Math.max(0, nextTime - Date.now());
    const hours = Math.floor(diff / (3600 * 1000));
    const minutes = Math.floor(diff % (3600 * 1000) / (60 * 1000));
    return `${hours}h ${minutes}m`;
}
function getPairs() {
    return [];
}
function getPairBySymbol(_symbol) {
    return undefined;
}
function getAccountSummary() {
    return {
        balance: 0,
        equity: 0,
        unrealizedPnl: 0,
        marginUsed: 0,
        availableMargin: 0,
        marginRatio: 0
    };
}
function getOpenPositions() {
    return [];
}
function getPendingOrders() {
    return [];
}
function getTradeHistory() {
    return [];
}
function getFundingPayments() {
    return [];
}
function getLeaderboard() {
    return [];
}
}),
"[project]/frontend/src/lib/useOnChainStocks.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOnChainHoldings",
    ()=>useOnChainHoldings,
    "useOnChainStocks",
    ()=>useOnChainStocks
]);
/**
 * useOnChainStocks — reads synthetic stock data from on-chain contracts.
 *
 * Replaces mock MOCK_STOCKS/MOCK_HOLDINGS/MOCK_TRADES from stockData.ts
 * with real reads from SyntheticAssetFactory, CollateralVault, and PriceOracle.
 *
 * Falls back to empty data when contracts are unavailable.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
// ─── Fallback demo stocks when on-chain data is unavailable ──────────────────
const FALLBACK_STOCKS = [
    {
        ticker: 'AAPL',
        name: 'sAAPL',
        displayName: 'Apple Inc.',
        sector: 'Technology',
        description: 'Apple Inc. — smartphones, computers, services.',
        price: 218.27,
        change24h: 1.3,
        volume24h: 62_000_000,
        marketCap: 3_340_000_000_000,
        high52w: 237.49,
        low52w: 164.08,
        sparkline7d: [
            213,
            214,
            215,
            216,
            217,
            218,
            218.27
        ],
        peRatio: 33.8,
        eps: 6.46,
        dividendYield: 0.44,
        avgVolume: 58_000_000
    },
    {
        ticker: 'MSFT',
        name: 'sMSFT',
        displayName: 'Microsoft Corp.',
        sector: 'Technology',
        description: 'Microsoft Corp. — Windows, Azure, Office.',
        price: 388.45,
        change24h: 0.9,
        volume24h: 22_000_000,
        marketCap: 2_890_000_000_000,
        high52w: 420.82,
        low52w: 309.45,
        sparkline7d: [
            383,
            384,
            385,
            386,
            387,
            388,
            388.45
        ],
        peRatio: 34.2,
        eps: 11.36,
        dividendYield: 0.72,
        avgVolume: 20_000_000
    },
    {
        ticker: 'GOOGL',
        name: 'sGOOGL',
        displayName: 'Alphabet Inc.',
        sector: 'Technology',
        description: 'Alphabet Inc. — Google, YouTube, Cloud.',
        price: 161.12,
        change24h: -0.5,
        volume24h: 25_000_000,
        marketCap: 2_010_000_000_000,
        high52w: 191.75,
        low52w: 130.67,
        sparkline7d: [
            159,
            160,
            160.5,
            161,
            161.2,
            161,
            161.12
        ],
        peRatio: 22.1,
        eps: 7.29,
        dividendYield: 0.50,
        avgVolume: 23_000_000
    },
    {
        ticker: 'AMZN',
        name: 'sAMZN',
        displayName: 'Amazon.com',
        sector: 'Consumer',
        description: 'Amazon.com — e-commerce & AWS cloud.',
        price: 186.21,
        change24h: 1.8,
        volume24h: 48_000_000,
        marketCap: 1_950_000_000_000,
        high52w: 201.20,
        low52w: 151.61,
        sparkline7d: [
            182,
            183,
            184,
            185,
            185.5,
            186,
            186.21
        ],
        peRatio: 58.3,
        eps: 3.19,
        dividendYield: 0,
        avgVolume: 44_000_000
    },
    {
        ticker: 'NVDA',
        name: 'sNVDA',
        displayName: 'NVIDIA Corp.',
        sector: 'Technology',
        description: 'NVIDIA Corp. — GPUs & AI computing.',
        price: 104.75,
        change24h: 3.2,
        volume24h: 310_000_000,
        marketCap: 2_580_000_000_000,
        high52w: 153.13,
        low52w: 75.61,
        sparkline7d: [
            98,
            99,
            101,
            102,
            103,
            104,
            104.75
        ],
        peRatio: 60.1,
        eps: 1.74,
        dividendYield: 0.03,
        avgVolume: 280_000_000
    },
    {
        ticker: 'TSLA',
        name: 'sTSLA',
        displayName: 'Tesla Inc.',
        sector: 'Automotive',
        description: 'Tesla Inc. — electric vehicles & energy.',
        price: 272.18,
        change24h: -2.1,
        volume24h: 95_000_000,
        marketCap: 874_000_000_000,
        high52w: 488.54,
        low52w: 138.80,
        sparkline7d: [
            280,
            278,
            276,
            275,
            274,
            273,
            272.18
        ],
        peRatio: 150.2,
        eps: 1.81,
        dividendYield: 0,
        avgVolume: 88_000_000
    },
    {
        ticker: 'META',
        name: 'sMETA',
        displayName: 'Meta Platforms',
        sector: 'Technology',
        description: 'Meta Platforms — Facebook, Instagram, WhatsApp.',
        price: 567.89,
        change24h: 0.6,
        volume24h: 18_000_000,
        marketCap: 1_430_000_000_000,
        high52w: 602.95,
        low52w: 414.50,
        sparkline7d: [
            562,
            563,
            564,
            565,
            566,
            567,
            567.89
        ],
        peRatio: 25.7,
        eps: 22.10,
        dividendYield: 0.36,
        avgVolume: 16_000_000
    },
    {
        ticker: 'NFLX',
        name: 'sNFLX',
        displayName: 'Netflix',
        sector: 'Entertainment',
        description: 'Netflix — streaming entertainment.',
        price: 998.61,
        change24h: 1.1,
        volume24h: 5_200_000,
        marketCap: 428_000_000_000,
        high52w: 1040.00,
        low52w: 550.64,
        sparkline7d: [
            990,
            992,
            994,
            995,
            996,
            997,
            998.61
        ],
        peRatio: 48.9,
        eps: 20.42,
        dividendYield: 0,
        avgVolume: 4_800_000
    },
    {
        ticker: 'AMD',
        name: 'sAMD',
        displayName: 'AMD',
        sector: 'Technology',
        description: 'AMD — CPUs, GPUs, adaptive computing.',
        price: 101.32,
        change24h: -1.5,
        volume24h: 42_000_000,
        marketCap: 164_000_000_000,
        high52w: 187.28,
        low52w: 97.09,
        sparkline7d: [
            104,
            103,
            102.5,
            102,
            101.8,
            101.5,
            101.32
        ],
        peRatio: 102.3,
        eps: 0.99,
        dividendYield: 0,
        avgVolume: 38_000_000
    },
    {
        ticker: 'COIN',
        name: 'sCOIN',
        displayName: 'Coinbase Global',
        sector: 'Finance',
        description: 'Coinbase Global — crypto exchange platform.',
        price: 178.54,
        change24h: 4.2,
        volume24h: 12_000_000,
        marketCap: 43_500_000_000,
        high52w: 349.75,
        low52w: 146.12,
        sparkline7d: [
            170,
            172,
            174,
            175,
            176,
            177,
            178.54
        ],
        peRatio: 28.6,
        eps: 6.24,
        dividendYield: 0,
        avgVolume: 10_000_000
    }
];
const FACTORY = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SyntheticAssetFactory;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].CollateralVault;
const ORACLE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
// Static metadata for known stocks (sector/description/company name enrichment)
const STOCK_META = {
    AAPL: {
        sector: 'Technology',
        description: 'Apple Inc. — smartphones, computers, services.',
        companyName: 'Apple Inc.'
    },
    TSLA: {
        sector: 'Automotive',
        description: 'Tesla Inc. — electric vehicles & energy.',
        companyName: 'Tesla Inc.'
    },
    NVDA: {
        sector: 'Technology',
        description: 'NVIDIA Corp. — GPUs & AI computing.',
        companyName: 'NVIDIA Corp.'
    },
    MSFT: {
        sector: 'Technology',
        description: 'Microsoft Corp. — Windows, Azure, Office.',
        companyName: 'Microsoft Corp.'
    },
    AMZN: {
        sector: 'Consumer',
        description: 'Amazon.com — e-commerce & AWS cloud.',
        companyName: 'Amazon.com'
    },
    GOOGL: {
        sector: 'Technology',
        description: 'Alphabet Inc. — Google, YouTube, Cloud.',
        companyName: 'Alphabet Inc.'
    },
    META: {
        sector: 'Technology',
        description: 'Meta Platforms — Facebook, Instagram, WhatsApp.',
        companyName: 'Meta Platforms'
    },
    JPM: {
        sector: 'Finance',
        description: 'JPMorgan Chase — banking & financial services.',
        companyName: 'JPMorgan Chase'
    },
    V: {
        sector: 'Finance',
        description: 'Visa Inc. — global payments network.',
        companyName: 'Visa Inc.'
    },
    DIS: {
        sector: 'Entertainment',
        description: 'Walt Disney — media, parks, streaming.',
        companyName: 'Walt Disney'
    },
    NFLX: {
        sector: 'Entertainment',
        description: 'Netflix — streaming entertainment.',
        companyName: 'Netflix'
    },
    AMD: {
        sector: 'Technology',
        description: 'AMD — CPUs, GPUs, adaptive computing.',
        companyName: 'AMD'
    },
    COIN: {
        sector: 'Finance',
        description: 'Coinbase Global — crypto exchange platform.',
        companyName: 'Coinbase Global'
    }
};
// Known tickers (matches what DeployGoodStocks deployed)
const KNOWN_TICKERS = [
    'AAPL',
    'TSLA',
    'NVDA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'JPM',
    'V',
    'DIS',
    'NFLX',
    'AMD'
];
function useOnChainStocks() {
    // Read prices for all known tickers from StocksPriceOracle
    const priceContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!ORACLE) return [];
        return KNOWN_TICKERS.map((ticker)=>({
                address: ORACLE,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                functionName: 'getPrice',
                args: [
                    ticker
                ]
            }));
    }, []);
    const { data: priceData, isLoading, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: priceContracts,
        query: {
            enabled: priceContracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const stocks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!priceData || priceData.length === 0) return [];
        return KNOWN_TICKERS.map((ticker, i)=>{
            const r = priceData[i];
            const price = r?.status === 'success' && typeof r.result === 'bigint' ? Number(r.result) / 1e8 : 0;
            if (price === 0) return null;
            const meta = STOCK_META[ticker] ?? {
                sector: 'Unknown',
                description: `Synthetic ${ticker}`,
                companyName: ticker
            };
            return {
                ticker,
                name: `s${ticker}`,
                displayName: meta.companyName,
                sector: meta.sector,
                description: meta.description,
                price,
                change24h: 0,
                volume24h: 0,
                marketCap: 0,
                high52w: price * 1.15,
                low52w: price * 0.75,
                sparkline7d: null,
                peRatio: 0,
                eps: 0,
                dividendYield: 0,
                avgVolume: 0
            };
        }).filter(Boolean);
    }, [
        priceData
    ]);
    const finalStocks = stocks.length > 0 ? stocks : FALLBACK_STOCKS;
    return {
        stocks: finalStocks,
        isLoading,
        isLive: stocks.length > 0,
        refetch
    };
}
function useOnChainHoldings() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    // Read positions for all tickers
    const posContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!VAULT || !address) return [];
        return KNOWN_TICKERS.map((ticker)=>({
                address: VAULT,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                functionName: 'getPosition',
                args: [
                    address,
                    ticker
                ]
            }));
    }, [
        address
    ]);
    // Read prices
    const priceContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!ORACLE) return [];
        return KNOWN_TICKERS.map((ticker)=>({
                address: ORACLE,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                functionName: 'getPrice',
                args: [
                    ticker
                ]
            }));
    }, []);
    const { data: posData, isLoading: posLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: posContracts,
        query: {
            enabled: posContracts.length > 0,
            refetchInterval: 15_000,
            staleTime: 15_000
        }
    });
    const { data: priceData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: priceContracts,
        query: {
            enabled: priceContracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const holdings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!posData) return [];
        const result = [];
        for(let i = 0; i < KNOWN_TICKERS.length; i++){
            const posR = posData[i];
            if (posR?.status !== 'success' || !posR.result) continue;
            const [collateralAmount, debtAmount] = posR.result;
            if (debtAmount === BigInt(0)) continue; // no position
            const shares = Number(debtAmount) / 1e18;
            const collateral = Number(collateralAmount) / 1e18;
            const priceR = priceData?.[i];
            const currentPrice = priceR?.status === 'success' && typeof priceR.result === 'bigint' ? Number(priceR.result) / 1e8 : 0;
            result.push({
                ticker: KNOWN_TICKERS[i],
                shares,
                avgCost: currentPrice,
                currentPrice,
                collateralDeposited: collateral,
                collateralRequired: shares * currentPrice * 0.5
            });
        }
        return result;
    }, [
        posData,
        priceData
    ]);
    return {
        holdings,
        isLoading: posLoading
    };
}
}),
"[project]/frontend/src/lib/usePerpsHistory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useFundingPayments",
    ()=>useFundingPayments,
    "useLeaderboard",
    ()=>useLeaderboard,
    "useOracleMarkPrices",
    ()=>useOracleMarkPrices,
    "useTradeHistory",
    ()=>useTradeHistory
]);
/**
 * usePerpsHistory — reads perps trade history, funding payments, and leaderboard
 * from the GoodDollar L2 indexer API and on-chain PerpPriceOracle.
 *
 * The indexer (backend/indexer) stores PositionOpened, PositionClosed,
 * FundingApplied, and PositionLiquidated events. We query its REST API
 * and transform them into the types expected by the portfolio page.
 *
 * Also exports useOracleMarkPrices() which reads mark prices from PerpPriceOracle.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
// ─── Config ───────────────────────────────────────────────────────────────────
// Public indexer URL. MUST be a public origin in production; if unset we treat
// the indexer as unavailable and short-circuit to empty results rather than
// shipping a `localhost:NNNN` literal into the production client bundle (where
// it would either CORS-fail or, worse, be blocked as mixed content). For local
// development, set NEXT_PUBLIC_INDEXER_URL=http://localhost:4200 in
// frontend/.env.local. See docs/testnet/iter12-frontend-env-freeze.md.
const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || '';
// Market oracle keys (keccak256 of ticker string) — used for oracle reads
// Market ordering matches PerpEngine.markets[] array (verified via on-chain reads)
const MARKET_ORACLE_KEYS = {
    0: {
        key: '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4',
        symbol: 'ETH-USD'
    },
    1: {
        key: '0xe98e2830be1a7e4156d656a7505e65d08c67660dc618072422e9c78053c261e9',
        symbol: 'BTC-USD'
    },
    2: {
        key: '0x0a3ec4fc70eaf64faf6eeda4e9b2bd4742a785464053aa23afad8bd24650e86f',
        symbol: 'SOL-USD'
    },
    3: {
        key: '0x3ed03c38e59dc60c7b69c2a4bf68f9214acd953252b5a90e8f5f59583e9bc3ae',
        symbol: 'BNB-USD'
    },
    4: {
        key: '0xa6a7de01e8b7ba6a4a61c782a73188d808fc1f3cf5743fadb68a02ed884b594f',
        symbol: 'MATIC-USD'
    },
    5: {
        key: '0xc07524b7a4eecc2784fc7ac17ff2730f877f3cf7a2ceb4e2375fa40a103115d0',
        symbol: 'ARB-USD'
    }
};
// Minimal ABI for PerpPriceOracle reads
const PerpPriceOracleABI = [
    {
        name: 'getMarkPrice',
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        name: 'getIndexPrice',
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const ORACLE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].PerpPriceOracle;
function useOracleMarkPrices(marketCount) {
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const list = [];
        for(let i = 0; i < marketCount; i++){
            const m = MARKET_ORACLE_KEYS[i];
            if (!m || m.key === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
            list.push({
                address: ORACLE,
                abi: PerpPriceOracleABI,
                functionName: 'getMarkPrice',
                args: [
                    m.key
                ]
            });
            list.push({
                address: ORACLE,
                abi: PerpPriceOracleABI,
                functionName: 'getIndexPrice',
                args: [
                    m.key
                ]
            });
        }
        return list;
    }, [
        marketCount
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const { markPrices, indexPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const mark = {};
        const index = {};
        if (!data) return {
            markPrices: mark,
            indexPrices: index
        };
        let dataIdx = 0;
        for(let i = 0; i < Math.min(marketCount, Object.keys(MARKET_ORACLE_KEYS).length); i++){
            const m = MARKET_ORACLE_KEYS[i];
            if (!m || m.key === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
            const markResult = data[dataIdx];
            const indexResult = data[dataIdx + 1];
            dataIdx += 2;
            if (markResult?.status === 'success' && markResult.result) {
                mark[i] = Number(markResult.result) / 1e8;
            }
            if (indexResult?.status === 'success' && indexResult.result) {
                index[i] = Number(indexResult.result) / 1e8;
            }
        }
        return {
            markPrices: mark,
            indexPrices: index
        };
    }, [
        data,
        marketCount
    ]);
    return {
        markPrices,
        indexPrices,
        isLoading
    };
}
async function fetchIndexerEvents(protocol, eventName, limit = 100) {
    // No indexer URL configured → treat as unavailable. Callers already render
    // empty-state UI for empty arrays, so this is safe and avoids spurious
    // CORS/network errors in the browser console.
    if (!INDEXER_URL) return [];
    try {
        const params = new URLSearchParams({
            limit: String(limit)
        });
        if (eventName) params.set('event', eventName);
        const url = `${INDEXER_URL}/api/events/${protocol}?${params}`;
        const res = await fetch(url, {
            next: {
                revalidate: 15
            }
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.ok ? json.data : [];
    } catch  {
        return [];
    }
}
// Map marketId → symbol
const MARKET_SYMBOLS = {
    0: 'ETH-USD',
    1: 'BTC-USD',
    2: 'SOL-USD',
    3: 'BNB-USD',
    4: 'MATIC-USD',
    5: 'ARB-USD'
};
function useTradeHistory() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const [trades, setTrades] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!address) {
            setTrades([]);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            // Fetch PositionClosed (completed trades) and PositionOpened (entry info)
            // in parallel. Both are independent reads against the same indexer
            // endpoint; serializing them was an unnecessary waterfall that doubled
            // the Trades-tab load latency. fetchIndexerEvents already returns [] on
            // failure, so Promise.all here cannot reject.
            const [closedEvents, openedEvents] = await Promise.all([
                fetchIndexerEvents('perps', 'PositionClosed', 200),
                fetchIndexerEvents('perps', 'PositionOpened', 200)
            ]);
            if (cancelled) return;
            const userAddr = address.toLowerCase();
            // Build a map of opened events by tx hash for cross-reference
            const openedByKey = new Map();
            for (const ev of openedEvents){
                const trader = String(ev.args.trader || '').toLowerCase();
                const mktId = Number(ev.args.marketId ?? 0);
                if (trader === userAddr) {
                    openedByKey.set(`${trader}-${mktId}`, ev);
                }
            }
            // Map closed events to TradeHistoryRecord
            const records = closedEvents.filter((ev)=>String(ev.args.trader || '').toLowerCase() === userAddr).map((ev, idx)=>{
                const mktId = Number(ev.args.marketId ?? 0);
                const pnl = Number(ev.args.pnl ?? 0) / 1e18;
                const exitPrice = Number(ev.args.exitPrice ?? 0) / 1e8;
                const opened = openedByKey.get(`${userAddr}-${mktId}`);
                const entryPrice = opened ? Number(opened.args.entryPrice ?? 0) / 1e8 : exitPrice;
                const size = opened ? Number(opened.args.size ?? 0) / 1e18 : 0;
                const isLong = opened ? Boolean(opened.args.isLong) : true;
                const notional = size * entryPrice;
                const fee = notional * 0.001 // 0.1% fee
                ;
                return {
                    id: ev.tx_hash.slice(0, 10) + '-' + idx,
                    pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                    side: isLong ? 'long' : 'short',
                    type: 'market',
                    size,
                    price: exitPrice || entryPrice,
                    fee,
                    pnl,
                    timestamp: ev.timestamp * 1000
                };
            });
            // Also include open events as "entry" trades for visibility
            const entryRecords = openedEvents.filter((ev)=>String(ev.args.trader || '').toLowerCase() === userAddr).map((ev, idx)=>{
                const mktId = Number(ev.args.marketId ?? 0);
                const entryPrice = Number(ev.args.entryPrice ?? 0) / 1e8;
                const size = Number(ev.args.size ?? 0) / 1e18;
                const isLong = Boolean(ev.args.isLong);
                const notional = size * entryPrice;
                const fee = notional * 0.001;
                return {
                    id: 'open-' + ev.tx_hash.slice(0, 10) + '-' + idx,
                    pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                    side: isLong ? 'long' : 'short',
                    type: 'market',
                    size,
                    price: entryPrice,
                    fee,
                    pnl: 0,
                    timestamp: ev.timestamp * 1000
                };
            });
            setTrades([
                ...records,
                ...entryRecords
            ].sort((a, b)=>b.timestamp - a.timestamp));
            setIsLoading(false);
        }
        load();
        // Refresh every 30 seconds
        const interval = setInterval(load, 30_000);
        return ()=>{
            cancelled = true;
            clearInterval(interval);
        };
    }, [
        address
    ]);
    return {
        trades,
        isLoading
    };
}
function useFundingPayments() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const [funding, setFunding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!address) {
            setFunding([]);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            const events = await fetchIndexerEvents('perps', 'FundingApplied', 100);
            if (cancelled) return;
            // FundingApplied events are per-market, not per-user.
            // We show all funding events for markets the user has/had positions in.
            const payments = events.map((ev)=>{
                const mktId = Number(ev.args.marketId ?? 0);
                const rate = Number(ev.args.rate ?? 0) / 1e18;
                // Estimate user's funding payment based on rate (simplified)
                // In production, we'd track per-position funding accumulation
                const amount = rate * 100 // placeholder magnitude
                ;
                return {
                    pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                    amount,
                    rate,
                    timestamp: ev.timestamp * 1000
                };
            });
            setFunding(payments.sort((a, b)=>b.timestamp - a.timestamp));
            setIsLoading(false);
        }
        load();
        const interval = setInterval(load, 60_000);
        return ()=>{
            cancelled = true;
            clearInterval(interval);
        };
    }, [
        address
    ]);
    return {
        funding,
        isLoading
    };
}
function useLeaderboard() {
    const [leaderboard, setLeaderboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            const closedEvents = await fetchIndexerEvents('perps', 'PositionClosed', 500);
            if (cancelled) return;
            // Aggregate PnL per trader
            const traders = new Map();
            for (const ev of closedEvents){
                const trader = String(ev.args.trader || '').toLowerCase();
                const pnl = Number(ev.args.pnl ?? 0) / 1e18;
                const mktId = Number(ev.args.marketId ?? 0);
                if (!traders.has(trader)) {
                    traders.set(trader, {
                        pnl: 0,
                        wins: 0,
                        total: 0,
                        markets: new Set()
                    });
                }
                const t = traders.get(trader);
                t.pnl += pnl;
                t.total += 1;
                if (pnl > 0) t.wins += 1;
                t.markets.add(MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`);
            }
            const sorted = [
                ...traders.entries()
            ].sort(([, a], [, b])=>b.pnl - a.pnl).slice(0, 20).map(([addr, data], i)=>({
                    rank: i + 1,
                    address: addr.slice(0, 6) + '...' + addr.slice(-4),
                    pnl: data.pnl,
                    winRate: data.total > 0 ? data.wins / data.total : 0,
                    totalTrades: data.total,
                    topPair: [
                        ...data.markets
                    ][0] || 'N/A'
                }));
            setLeaderboard(sorted);
            setIsLoading(false);
        }
        load();
        const interval = setInterval(load, 120_000);
        return ()=>{
            cancelled = true;
            clearInterval(interval);
        };
    }, []);
    return {
        leaderboard,
        isLoading
    };
}
}),
"[project]/frontend/src/lib/useOnChainPerps.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOnChainAccountSummary",
    ()=>useOnChainAccountSummary,
    "useOnChainPairs",
    ()=>useOnChainPairs,
    "useOnChainPositions",
    ()=>useOnChainPositions
]);
/**
 * useOnChainPerps — reads perpetual futures data from PerpEngine + MarginVault on-chain.
 *
 * Replaces mock data from perpsData.ts with real contract reads.
 * Falls back to empty arrays when no on-chain data is available.
 *
 * PerpEngine (chain 42069): markets, positions, unrealized PnL
 * MarginVault: deposited margin balances
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePerpsHistory.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
// ─── Fallback demo pairs when on-chain data is unavailable ───────────────────
function derive24hHighLow(markPrice, change24h) {
    const swing = Math.abs(change24h) / 100 * 0.6;
    return {
        high24h: markPrice * (1 + swing),
        low24h: markPrice * (1 - swing)
    };
}
const FALLBACK_PAIRS = [
    {
        marketId: 0,
        symbol: 'BTC-USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        markPrice: 84250,
        indexPrice: 84200,
        change24h: 2.4,
        volume24h: 1_250_000_000,
        fundingRate: 0.0045,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 890_000_000,
        maxLeverage: 100,
        ...derive24hHighLow(84250, 2.4)
    },
    {
        marketId: 1,
        symbol: 'ETH-USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        markPrice: 1820,
        indexPrice: 1818,
        change24h: -1.2,
        volume24h: 580_000_000,
        fundingRate: -0.0012,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 420_000_000,
        maxLeverage: 50,
        ...derive24hHighLow(1820, -1.2)
    },
    {
        marketId: 2,
        symbol: 'SOL-USD',
        baseAsset: 'SOL',
        quoteAsset: 'USD',
        markPrice: 134.5,
        indexPrice: 134.2,
        change24h: 5.8,
        volume24h: 180_000_000,
        fundingRate: 0.0078,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 95_000_000,
        maxLeverage: 25,
        ...derive24hHighLow(134.5, 5.8)
    },
    {
        marketId: 3,
        symbol: 'BNB-USD',
        baseAsset: 'BNB',
        quoteAsset: 'USD',
        markPrice: 608,
        indexPrice: 607,
        change24h: 0.8,
        volume24h: 45_000_000,
        fundingRate: 0.0015,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 32_000_000,
        maxLeverage: 25,
        ...derive24hHighLow(608, 0.8)
    },
    {
        marketId: 5,
        symbol: 'ARB-USD',
        baseAsset: 'ARB',
        quoteAsset: 'USD',
        markPrice: 0.82,
        indexPrice: 0.819,
        change24h: -3.1,
        volume24h: 28_000_000,
        fundingRate: -0.0025,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 18_000_000,
        maxLeverage: 20,
        ...derive24hHighLow(0.82, -3.1)
    }
];
const ENGINE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].PerpEngine;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault;
const FUNDING_RATE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].FundingRate;
const FUNDING_INTERVAL_MS = 8 * 3600 * 1000 // 8 hours fallback
;
// ─── Static market metadata (pairs the PerpEngine supports) ──────────────────
// The on-chain PerpEngine stores markets by ID with a bytes32 key.
// We map known market IDs to human-readable pair info.
// On-chain market ordering (DeployPerps.s.sol seed + keccak256 ticker keys):
//   Market 0: keccak256("BTC") → BTC-USD
//   Market 1: keccak256("ETH") → ETH-USD
const MARKET_META = {
    0: {
        symbol: 'BTC-USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        maxLeverage: 100
    },
    1: {
        symbol: 'ETH-USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        maxLeverage: 50
    },
    2: {
        symbol: 'SOL-USD',
        baseAsset: 'SOL',
        quoteAsset: 'USD',
        maxLeverage: 25
    },
    3: {
        symbol: 'BNB-USD',
        baseAsset: 'BNB',
        quoteAsset: 'USD',
        maxLeverage: 25
    },
    4: {
        symbol: 'MATIC-USD',
        baseAsset: 'MATIC',
        quoteAsset: 'USD',
        maxLeverage: 20
    },
    5: {
        symbol: 'ARB-USD',
        baseAsset: 'ARB',
        quoteAsset: 'USD',
        maxLeverage: 20
    }
};
function useOnChainPairs() {
    const countResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ENGINE,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PerpEngineABI"],
        functionName: 'marketCount',
        query: {
            enabled: !!ENGINE,
            refetchInterval: 60_000,
            retry: false
        }
    });
    const count = Number(countResult.data ?? BigInt(0));
    const maxRead = Math.min(count, 10);
    const marketContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (maxRead === 0) return [];
        return Array.from({
            length: maxRead
        }, (_, i)=>({
                address: ENGINE,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                functionName: 'markets',
                args: [
                    BigInt(i)
                ]
            }));
    }, [
        maxRead
    ]);
    const fundingContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (maxRead === 0) return [];
        return Array.from({
            length: maxRead
        }, (_, i)=>({
                address: FUNDING_RATE,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FundingRateABI"],
                functionName: 'lastFundingTime',
                args: [
                    BigInt(i)
                ]
            }));
    }, [
        maxRead
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: marketContracts,
        query: {
            enabled: maxRead > 0,
            refetchInterval: 30_000,
            retry: false
        }
    });
    const { data: fundingData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: fundingContracts,
        query: {
            enabled: maxRead > 0,
            refetchInterval: 60_000,
            retry: false
        }
    });
    // Read oracle prices for all active markets
    const { markPrices, indexPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOracleMarkPrices"])(maxRead);
    const pairs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data || data.length === 0) return [];
        const result = [];
        for(let i = 0; i < data.length; i++){
            const r = data[i];
            if (r.status !== 'success' || !r.result) continue;
            const [, maxLeverage, isActive] = r.result;
            if (!isActive) continue;
            const meta = MARKET_META[i] ?? {
                symbol: `MKT-${i}`,
                baseAsset: `MKT${i}`,
                quoteAsset: 'USD',
                maxLeverage: 10
            };
            const lastFundingTime = fundingData?.[i]?.status === 'success' ? Number(fundingData[i].result) * 1000 // convert seconds to ms
             : 0;
            const nextFundingTime = lastFundingTime > 0 ? lastFundingTime + FUNDING_INTERVAL_MS : Date.now() + FUNDING_INTERVAL_MS;
            const fallbackPair = FALLBACK_PAIRS.find((p)=>p.symbol === meta.symbol);
            const mark = markPrices[i] && markPrices[i] > 0 ? markPrices[i] : fallbackPair?.markPrice ?? 0;
            const index = indexPrices[i] && indexPrices[i] > 0 ? indexPrices[i] : fallbackPair?.indexPrice ?? mark;
            const change = fallbackPair?.change24h ?? 0;
            const hl = derive24hHighLow(mark, change);
            result.push({
                marketId: i,
                symbol: meta.symbol,
                baseAsset: meta.baseAsset,
                quoteAsset: meta.quoteAsset,
                markPrice: mark,
                indexPrice: index,
                change24h: change,
                volume24h: fallbackPair?.volume24h ?? 0,
                fundingRate: fallbackPair?.fundingRate ?? 0,
                nextFundingTime,
                openInterest: fallbackPair?.openInterest ?? 0,
                maxLeverage: Number(maxLeverage),
                high24h: hl.high24h,
                low24h: hl.low24h
            });
        }
        return result;
    }, [
        data,
        fundingData,
        markPrices,
        indexPrices
    ]);
    const finalPairs = pairs.length > 0 ? pairs : FALLBACK_PAIRS;
    return {
        pairs: finalPairs,
        isLoading,
        isLive: pairs.length > 0
    };
}
function useOnChainPositions() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const { pairs } = useOnChainPairs();
    const { markPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOracleMarkPrices"])(pairs.length);
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!address || pairs.length === 0) return [];
        return pairs.flatMap((pair)=>[
                {
                    address: ENGINE,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                    functionName: 'positions',
                    args: [
                        address,
                        BigInt(pair.marketId)
                    ]
                },
                {
                    address: ENGINE,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                    functionName: 'unrealizedPnL',
                    args: [
                        address,
                        BigInt(pair.marketId)
                    ]
                }
            ]);
    }, [
        address,
        pairs
    ]) // eslint-disable-line react-hooks/exhaustive-deps
    ;
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 10_000
        }
    });
    const positions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data || data.length === 0) return [];
        const result = [];
        for(let i = 0; i < pairs.length; i++){
            const pair = pairs[i];
            const posResult = data[i * 2];
            const pnlResult = data[i * 2 + 1];
            if (posResult?.status !== 'success' || !posResult.result) continue;
            const [isOpen, isLong, size, entryPrice, margin] = posResult.result;
            if (!isOpen || size === BigInt(0)) continue; // no position
            const pnl = pnlResult?.status === 'success' ? Number(pnlResult.result) / 1e18 : 0;
            const sizeFloat = Number(size) / 1e18;
            const entryFloat = Number(entryPrice) / 1e8;
            const collFloat = Number(margin) / 1e18;
            const leverage = collFloat > 0 ? Math.round(sizeFloat * entryFloat / collFloat) : 1;
            const mark = markPrices[pair.marketId] ?? entryFloat // oracle mark price, fallback to entry
            ;
            // Liquidation price estimate: entry ± (margin / size) adjusted by maintenance margin
            const marginPerUnit = collFloat > 0 ? collFloat / sizeFloat : 0;
            const maintenanceRatio = 0.02 // 2% maintenance margin
            ;
            const liqPrice = isLong ? entryFloat - marginPerUnit * (1 - maintenanceRatio) : entryFloat + marginPerUnit * (1 - maintenanceRatio);
            result.push({
                pair: pair.symbol,
                side: isLong ? 'long' : 'short',
                size: sizeFloat,
                leverage,
                entryPrice: entryFloat,
                markPrice: mark,
                liquidationPrice: Math.max(0, liqPrice),
                unrealizedPnl: pnl,
                margin: collFloat,
                marginMode: 'cross'
            });
        }
        return result;
    }, [
        data,
        pairs,
        markPrices
    ]);
    return {
        positions,
        isLoading
    };
}
function useOnChainAccountSummary() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const { positions } = useOnChainPositions();
    const balResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'balances',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const balance = balResult.data ? Number(balResult.data) / 1e18 : 0;
        const unrealizedPnl = positions.reduce((sum, p)=>sum + p.unrealizedPnl, 0);
        const equity = balance + unrealizedPnl;
        const marginUsed = positions.reduce((sum, p)=>sum + p.margin, 0);
        const availableMargin = Math.max(0, equity - marginUsed);
        const marginRatio = equity > 0 ? marginUsed / equity : 0;
        return {
            balance,
            equity,
            unrealizedPnl,
            marginUsed,
            availableMargin,
            marginRatio
        };
    }, [
        balResult.data,
        positions
    ]);
    return {
        summary,
        isLoading: balResult.isLoading
    };
}
}),
"[project]/frontend/src/lib/portfolioLendYieldData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMockLendPositions",
    ()=>useMockLendPositions,
    "useMockYieldPositions",
    ()=>useMockYieldPositions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_SUPPLIES = [
    {
        asset: 'gAAPL',
        amount: 12.5,
        apy: 4.2,
        healthFactor: 2.1,
        valueUsd: 2_437.50
    },
    {
        asset: 'G$',
        amount: 5_000,
        apy: 6.8,
        healthFactor: 3.4,
        valueUsd: 5_000.00
    },
    {
        asset: 'gTSLA',
        amount: 8.0,
        apy: 3.9,
        healthFactor: 1.8,
        valueUsd: 1_424.00
    }
];
const MOCK_BORROWS = [
    {
        asset: 'G$',
        amount: 2_000,
        rate: 8.5,
        accruedInterest: 14.17,
        valueUsd: 2_000.00
    }
];
const MOCK_VAULTS = [
    {
        name: 'GoodStocks LP',
        asset: 'gAAPL/G$',
        deposited: 3_000,
        currentValue: 3_187.50,
        yieldEarned: 187.50,
        apy: 12.5
    },
    {
        name: 'Stable Yield',
        asset: 'G$',
        deposited: 10_000,
        currentValue: 10_425.00,
        yieldEarned: 425.00,
        apy: 8.5
    },
    {
        name: 'Stock Index',
        asset: 'gSPY/G$',
        deposited: 5_000,
        currentValue: 5_112.75,
        yieldEarned: 112.75,
        apy: 9.0
    }
];
function useMockLendPositions() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const totalSupplied = MOCK_SUPPLIES.reduce((s, p)=>s + p.valueUsd, 0);
        const totalBorrowed = MOCK_BORROWS.reduce((s, p)=>s + p.valueUsd, 0);
        return {
            supplies: MOCK_SUPPLIES,
            borrows: MOCK_BORROWS,
            totalSupplied,
            totalBorrowed,
            netValue: totalSupplied - totalBorrowed
        };
    }, []);
}
function useMockYieldPositions() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const totalDeposited = MOCK_VAULTS.reduce((s, v)=>s + v.deposited, 0);
        const totalCurrentValue = MOCK_VAULTS.reduce((s, v)=>s + v.currentValue, 0);
        const totalYieldEarned = MOCK_VAULTS.reduce((s, v)=>s + v.yieldEarned, 0);
        return {
            vaults: MOCK_VAULTS,
            totalDeposited,
            totalCurrentValue,
            totalYieldEarned
        };
    }, []);
}
}),
"[project]/frontend/src/components/ConnectWalletEmptyState.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConnectWalletEmptyState",
    ()=>ConnectWalletEmptyState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
function ConnectWalletEmptyState({ title: _title, description: _description, children }) {
    // In demo mode, always show children (no wallet gate)
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
}),
"[project]/frontend/src/components/ConnectWalletBanner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConnectWalletBanner",
    ()=>ConnectWalletBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
/**
 * Chain ID for the Good Chain devnet (Anvil). Kept in lockstep with
 * `PortfolioOnChain.tsx` — when that file's CHAIN_ID changes, this must too.
 */ const CHAIN_ID = 42069;
function ConnectWalletBanner() {
    const { isConnected, chainId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    // Connected and on the right chain → render nothing.
    if (isConnected && chainId === CHAIN_ID) return null;
    const wrongChain = isConnected && chainId !== CHAIN_ID;
    const heading = wrongChain ? 'Switch to the Good Chain devnet' : 'Connect your wallet';
    // NOTE: Keep the connected-categories list in sync with the sections that
    // /portfolio actually renders (StockPositions, PredictPositions, PerpPositions).
    // When Lend / Stable / Swap portfolio sections ship, expand this sentence
    // back out — do not leave it stale.
    const description = wrongChain ? 'Your wallet is on a different network. Switch to chain 42069 to see your positions.' : 'See your live on-chain positions across Stocks, Predict, and Perps.';
    const ctaLabel = wrongChain ? 'Switch Network' : 'Connect Wallet';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ConnectButton"].Custom, {
        children: ({ openConnectModal, openChainModal })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "region",
                "aria-label": heading,
                className: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 mb-6 backdrop-blur-sm ${wrongChain ? 'bg-amber-500/10 border-amber-500/30' : 'bg-goodgreen/10 border-goodgreen/30'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start gap-3 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": true,
                                className: `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${wrongChain ? 'bg-amber-500/20 text-amber-300' : 'bg-goodgreen/10 text-goodgreen'}`,
                                children: wrongChain ? '⚠' : '✦'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                                lineNumber: 62,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm sm:text-base font-semibold text-white leading-tight",
                                        children: heading
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs sm:text-sm text-gray-300 mt-1 leading-snug",
                                        children: description
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                                        lineNumber: 76,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: wrongChain ? openChainModal : openConnectModal,
                        className: `shrink-0 self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100 ${wrongChain ? 'bg-amber-500 text-black hover:bg-amber-400 focus:ring-amber-400' : 'bg-goodgreen text-black hover:bg-goodgreen/90 focus:ring-goodgreen'}`,
                        children: ctaLabel
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                        lineNumber: 81,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ConnectWalletBanner.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/useGoodStable.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ILKS",
    ()=>ILKS,
    "ILK_ETH",
    ()=>ILK_ETH,
    "ILK_GD",
    ()=>ILK_GD,
    "ILK_USDC",
    ()=>ILK_USDC,
    "computeVaultState",
    ()=>computeVaultState,
    "maxMintable",
    ()=>maxMintable,
    "useCollateralBalance",
    ()=>useCollateralBalance,
    "useCollateralConfig",
    ()=>useCollateralConfig,
    "useConnectedAccount",
    ()=>useConnectedAccount,
    "useGUSDBalance",
    ()=>useGUSDBalance,
    "useGUSDTotalSupply",
    ()=>useGUSDTotalSupply,
    "useStableAction",
    ()=>useStableAction,
    "useVault",
    ()=>useVault
]);
/**
 * useGoodStable — wagmi hooks for GoodStable CDP vault interaction.
 *
 * Provides:
 *   - useVault(ilk, address): read vault state (collateral, debt, health factor)
 *   - useCollateralConfig(ilk): read collateral configuration from CollateralRegistry
 *   - useGUSDBalance(address): read gUSD token balance
 *   - useStableAction: approve + depositCollateral / withdrawCollateral / mintGUSD / repayGUSD
 *
 * The three supported ilks are:
 *   ETH  — MockWETH18, 150% liquidation ratio, ~2% APY stability fee
 *   GD   — MockGD18,   200% liquidation ratio, ~3% APY stability fee
 *   USDC — MockUSDC6,  101% liquidation ratio, ~0.5% APY stability fee
 *
 * Actual debt = normalizedDebt * chi / RAY (chi from VaultManager.accumulators).
 * Health factor = (collateralValue * WAD) / (actualDebt * liquidationRatio)
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWaitForTransactionReceipt.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/parseUnits.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/constants/number.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/formatUnits.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
;
const VAULT_MGR = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].VaultManager;
const REGISTRY = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].CollateralRegistry;
const RAY = BigInt('1000000000000000000000000000') // 1e27
;
const WAD = BigInt('1000000000000000000') // 1e18
;
const ILK_ETH = '0x4554480000000000000000000000000000000000000000000000000000000000';
const ILK_GD = '0x4744000000000000000000000000000000000000000000000000000000000000';
const ILK_USDC = '0x5553444300000000000000000000000000000000000000000000000000000000';
const ILKS = [
    {
        key: ILK_ETH,
        label: 'WETH',
        decimals: 18,
        minRatio: 150,
        tokenAddress: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StableMockWETH
    },
    {
        key: ILK_GD,
        label: 'G$',
        decimals: 18,
        minRatio: 200,
        tokenAddress: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StableMockGD
    },
    {
        key: ILK_USDC,
        label: 'USDC',
        decimals: 6,
        minRatio: 101,
        tokenAddress: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StableMockUSDC
    }
];
function computeVaultState(vaultData, accData, collateralDecimals, collateralPriceUSD, liquidationRatio) {
    if (!vaultData) return null;
    const [collateral, normalizedDebt] = vaultData;
    const chi = accData ? accData[0] : RAY;
    const effectiveChi = chi === BigInt(0) ? RAY : chi;
    const actualDebt = normalizedDebt === BigInt(0) ? BigInt(0) : normalizedDebt * effectiveChi / RAY;
    const collateralFloat = Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(collateral, collateralDecimals));
    const actualDebtFloat = Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(actualDebt, 18));
    const collateralValueUSD = collateralFloat * collateralPriceUSD;
    const healthFactor = actualDebtFloat === 0 ? Infinity : collateralValueUSD / (actualDebtFloat * liquidationRatio);
    return {
        collateral,
        normalizedDebt,
        actualDebt,
        chi: effectiveChi,
        collateralFloat,
        actualDebtFloat,
        healthFactor,
        isHealthy: healthFactor >= 1,
        hasPosition: collateral > BigInt(0) || normalizedDebt > BigInt(0)
    };
}
function useVault(ilk, owner, collateralDecimals, collateralPriceUSD, liquidationRatio) {
    const vaultResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT_MGR,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
        functionName: 'vaults',
        args: ilk && owner ? [
            ilk,
            owner
        ] : undefined,
        query: {
            enabled: !!ilk && !!owner,
            refetchInterval: 15_000
        }
    });
    const accResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT_MGR,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
        functionName: 'accumulators',
        args: ilk ? [
            ilk
        ] : undefined,
        query: {
            enabled: !!ilk,
            refetchInterval: 15_000
        }
    });
    const data = computeVaultState(vaultResult.data, accResult.data, collateralDecimals, collateralPriceUSD, liquidationRatio);
    if (!data) {
        return {
            data: null,
            isLoading: vaultResult.isLoading || accResult.isLoading
        };
    }
    return {
        data,
        isLoading: false
    };
}
function useCollateralConfig(ilk) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: REGISTRY,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CollateralRegistryABI"],
        functionName: 'getConfig',
        args: ilk ? [
            ilk
        ] : undefined,
        query: {
            enabled: !!ilk,
            refetchInterval: 60_000
        }
    });
    return {
        data: result.data ?? null,
        isLoading: result.isLoading
    };
}
function useGUSDBalance(address) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'balanceOf',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000
        }
    });
    return {
        balance: result.data ?? BigInt(0),
        balanceFloat: result.data ? Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(result.data, 18)) : 0,
        isLoading: result.isLoading
    };
}
function useGUSDTotalSupply() {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'totalSupply',
        query: {
            enabled: !!__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD,
            refetchInterval: 30_000
        }
    });
    return {
        totalSupply: result.data ?? BigInt(0),
        totalSupplyFloat: result.data ? Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(result.data, 18)) : 0,
        isLoading: result.isLoading
    };
}
function useCollateralBalance(tokenAddress, decimals, owner) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: tokenAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'balanceOf',
        args: owner ? [
            owner
        ] : undefined,
        query: {
            enabled: !!owner,
            refetchInterval: 10_000
        }
    });
    return {
        balance: result.data ?? BigInt(0),
        balanceFloat: result.data ? Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(result.data, decimals)) : 0,
        isLoading: result.isLoading
    };
}
function useStableAction() {
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const [txHash, setTxHash] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash: txHash
    });
    if (isConfirming && phase === 'submitting') setPhase('confirming');
    if (isConfirmed && phase === 'confirming') setPhase('done');
    const execute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (kind, ilk, amount, tokenAddress, tokenDecimals)=>{
        setError(undefined);
        setPhase('idle');
        try {
            // Close vault: approve gUSD (for burnFrom) then close atomically
            if (kind === 'close') {
                setPhase('approving');
                await writeContractAsync({
                    address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
                    functionName: 'approve',
                    args: [
                        VAULT_MGR,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxUint256"]
                    ]
                });
                setPhase('submitting');
                const hash = await writeContractAsync({
                    address: VAULT_MGR,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                    functionName: 'closeVault',
                    args: [
                        ilk
                    ]
                });
                setTxHash(hash);
                return;
            }
            const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseUnits"])(amount, kind === 'repay' ? 18 : tokenDecimals);
            // Deposit and repay need an ERC-20 approval first
            if (kind === 'deposit' || kind === 'repay') {
                setPhase('approving');
                const spendToken = kind === 'deposit' ? tokenAddress : __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD;
                await writeContractAsync({
                    address: spendToken,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
                    functionName: 'approve',
                    args: [
                        VAULT_MGR,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxUint256"]
                    ]
                });
            }
            setPhase('submitting');
            const functionName = kind === 'deposit' ? 'depositCollateral' : kind === 'withdraw' ? 'withdrawCollateral' : kind === 'mint' ? 'mintGUSD' : /* repay */ 'repayGUSD';
            const hash = await writeContractAsync({
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName,
                args: [
                    ilk,
                    kind === 'repay' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseUnits"])(amount, 18) : parsed
                ]
            });
            setTxHash(hash);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg.includes('User rejected') ? 'Transaction rejected.' : msg.slice(0, 120));
            setPhase('error');
        }
    }, [
        writeContractAsync
    ]);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setPhase('idle');
        setError(undefined);
        setTxHash(undefined);
    }, []);
    return {
        execute,
        phase,
        error,
        txHash,
        isConfirming,
        isConfirmed,
        reset
    };
}
function useConnectedAccount() {
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    return address;
}
function maxMintable(collateralFloat, collateralPriceUSD, liquidationRatio, existingDebt, safetyBuffer = 0.9) {
    const maxDebt = collateralFloat * collateralPriceUSD / liquidationRatio;
    return Math.max(0, maxDebt * safetyBuffer - existingDebt);
}
}),
"[project]/frontend/src/lib/usePriceFeeds.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
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
    if ("TURBOPACK compile-time truthy", 1) return; // SSR: no interval
    //TURBOPACK unreachable
    ;
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
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(store.state);
    // Stable key so we only re-subscribe when the symbol set actually changes.
    const key = symbols.join(',');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const subscriber = (next)=>setSnapshot(next);
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
        return ()=>{
            store.subscribers.delete(subscriber);
            release(symbols);
            stopIntervalIfIdle();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        key
    ]);
    return snapshot;
}
function getPrice(prices, symbol) {
    return prices[symbol] ?? FALLBACK_PRICES[symbol] ?? 0;
}
}),
"[project]/frontend/src/lib/useGoodLend.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeAccountData",
    ()=>computeAccountData,
    "formatTokenAmount",
    ()=>formatTokenAmount,
    "parseTokenAmount",
    ()=>parseTokenAmount,
    "useAllowance",
    ()=>useAllowance,
    "useApprove",
    ()=>useApprove,
    "useBorrow",
    ()=>useBorrow,
    "useConnectedAccount",
    ()=>useConnectedAccount,
    "useLendAction",
    ()=>useLendAction,
    "useRepay",
    ()=>useRepay,
    "useReserveData",
    ()=>useReserveData,
    "useSupply",
    ()=>useSupply,
    "useTokenBalance",
    ()=>useTokenBalance,
    "useUserAccountData",
    ()=>useUserAccountData,
    "useWithdraw",
    ()=>useWithdraw
]);
/**
 * useGoodLend — wagmi hooks for GoodLendPool on-chain interaction.
 *
 * Provides:
 *   - useReserveData(assetAddress): live reserve data (supply/borrow rates, TVL)
 *   - useUserAccountData(userAddress): health factor, collateral, debt
 *   - useSupply / useWithdraw / useBorrow / useRepay: write hooks
 *   - useLendAction: approve + action in one async flow
 *
 * Falls back to mock data when the wallet is not connected or the
 * devnet is unreachable (so the UI always renders something useful).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWaitForTransactionReceipt.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/parseUnits.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/constants/number.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
;
const POOL = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodLendPool;
const RAY = BigInt('1000000000000000000000000000')// 1e27
;
function useReserveData(assetAddress) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: POOL,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
        functionName: 'getReserveData',
        args: assetAddress ? [
            assetAddress
        ] : undefined,
        query: {
            enabled: !!assetAddress,
            refetchInterval: 15_000
        }
    });
    if (!result.data) {
        return {
            data: null,
            isLoading: result.isLoading,
            error: result.error
        };
    }
    const [totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury] = result.data;
    const ZERO = BigInt(0);
    const supplyAPY = supplyRate === ZERO ? 0 : Number(supplyRate) / Number(RAY);
    const borrowAPY = borrowRate === ZERO ? 0 : Number(borrowRate) / Number(RAY);
    const utilization = totalDeposits === ZERO ? 0 : Number(totalBorrows) / Number(totalDeposits);
    return {
        data: {
            totalDeposits,
            totalBorrows,
            liquidityIndex,
            borrowIndex,
            supplyRate,
            borrowRate,
            accruedToTreasury,
            supplyAPY,
            borrowAPY,
            utilization
        },
        isLoading: result.isLoading,
        error: result.error
    };
}
function computeAccountData(raw) {
    if (!raw) return null;
    const [healthFactor, totalCollateralUSD, totalDebtUSD] = raw;
    const healthFactorFloat = healthFactor === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxUint256"] ? Infinity : Number(healthFactor) / Number(RAY);
    const totalCollateralFloat = Number(totalCollateralUSD) / 1e8;
    const totalDebtFloat = Number(totalDebtUSD) / 1e8;
    return {
        healthFactor,
        totalCollateralUSD,
        totalDebtUSD,
        healthFactorFloat,
        totalCollateralFloat,
        totalDebtFloat,
        isHealthy: healthFactorFloat >= 1.0,
        isAtRisk: healthFactorFloat < 1.2
    };
}
function useUserAccountData(userAddress) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: POOL,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
        functionName: 'getUserAccountData',
        args: userAddress ? [
            userAddress
        ] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 15_000
        }
    });
    return {
        data: computeAccountData(result.data),
        isLoading: result.isLoading
    };
}
function useAllowance(tokenAddress, ownerAddress) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: tokenAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'allowance',
        args: tokenAddress && ownerAddress ? [
            ownerAddress,
            POOL
        ] : undefined,
        query: {
            enabled: !!(tokenAddress && ownerAddress),
            refetchInterval: 10_000
        }
    });
    return {
        allowance: result.data ?? BigInt(0),
        isLoading: result.isLoading
    };
}
function useApprove() {
    const { writeContract, data: hash, isPending, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isLoading: isConfirming, isSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash
    });
    const approve = (tokenAddress, amount = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxUint256"])=>{
        writeContract({
            address: tokenAddress,
            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
            functionName: 'approve',
            args: [
                POOL,
                amount
            ]
        });
    };
    return {
        approve,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
function useSupply() {
    const { writeContract, data: hash, isPending, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isLoading: isConfirming, isSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash
    });
    const supply = (assetAddress, amount)=>{
        writeContract({
            address: POOL,
            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
            functionName: 'supply',
            args: [
                assetAddress,
                amount
            ]
        });
    };
    return {
        supply,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
function useWithdraw() {
    const { writeContract, data: hash, isPending, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isLoading: isConfirming, isSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash
    });
    const withdraw = (assetAddress, amount)=>{
        writeContract({
            address: POOL,
            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
            functionName: 'withdraw',
            args: [
                assetAddress,
                amount
            ]
        });
    };
    return {
        withdraw,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
function useBorrow() {
    const { writeContract, data: hash, isPending, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isLoading: isConfirming, isSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash
    });
    const borrow = (assetAddress, amount)=>{
        writeContract({
            address: POOL,
            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
            functionName: 'borrow',
            args: [
                assetAddress,
                amount
            ]
        });
    };
    return {
        borrow,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
function useRepay() {
    const { writeContract, data: hash, isPending, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isLoading: isConfirming, isSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWaitForTransactionReceipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWaitForTransactionReceipt"])({
        hash
    });
    const repay = (assetAddress, amount)=>{
        writeContract({
            address: POOL,
            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
            functionName: 'repay',
            args: [
                assetAddress,
                amount
            ]
        });
    };
    return {
        repay,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
function parseTokenAmount(amount, decimals) {
    if (!amount || isNaN(parseFloat(amount))) return BigInt(0);
    try {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseUnits"])(amount, decimals);
    } catch  {
        return BigInt(0);
    }
}
function formatTokenAmount(amount, decimals) {
    if (amount === BigInt(0)) return 0;
    return Number(amount) / Math.pow(10, decimals);
}
function useConnectedAccount() {
    const { address, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    return {
        address: address,
        isConnected
    };
}
function useLendAction() {
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setPhase('idle');
        setError(null);
    }, []);
    const execute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (action, assetAddress, amount)=>{
        if (!isConnected) {
            setError('Wallet not connected');
            return;
        }
        try {
            if (action === 'supply' || action === 'repay') {
                setPhase('approving');
                await writeContractAsync({
                    address: assetAddress,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
                    functionName: 'approve',
                    args: [
                        POOL,
                        amount
                    ]
                });
            }
            setPhase('pending');
            await writeContractAsync({
                address: POOL,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
                functionName: action,
                args: [
                    assetAddress,
                    amount
                ]
            });
            setPhase('done');
        } catch (err) {
            const e = err;
            setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
            setPhase('error');
        }
    }, [
        isConnected,
        writeContractAsync
    ]);
    return {
        execute,
        phase,
        error,
        reset,
        isConnected
    };
}
function useTokenBalance(tokenAddress, userAddress) {
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: tokenAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'balanceOf',
        args: tokenAddress && userAddress ? [
            userAddress
        ] : undefined,
        query: {
            enabled: !!(tokenAddress && userAddress),
            refetchInterval: 10_000
        }
    });
    return {
        balance: result.data ?? BigInt(0),
        isLoading: result.isLoading
    };
}
}),
"[project]/frontend/src/lib/usePortfolioReads.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePortfolioReads",
    ()=>usePortfolioReads
]);
/**
 * usePortfolioReads — batches all on-chain reads for <PortfolioOnChain>
 * into a single `multicall3.aggregate3` call via wagmi's
 * `useReadContracts` (plural).
 *
 * Before this hook existed, the panel held 6 separate `useReadContract`
 * instances:
 *   - GoodDollarToken.balanceOf            (1 call)
 *   - useGUSDBalance → gUSD.balanceOf      (1 call)
 *   - useUserAccountData → getUserAccountData (1 call)
 *   - useVault × 3 → vaults + accumulators (6 calls = 2×3)
 *                                            ────────
 *                                            9 eth_calls / 15s tick
 *
 * Now everything is one `multicall3.aggregate3` keyed by a stable
 * contract array, so React Query caches all 9 sub-results under one
 * key and consumers share that cache.
 *
 * The pure post-fetch math lives in `computeVaultState()` and
 * `computeAccountData()` from `useGoodStable.ts` and `useGoodLend.ts`,
 * so per-row hooks (`useVault`, `useUserAccountData`) and this batched
 * hook cannot drift.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/formatUnits.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useGoodStable.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodLend$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useGoodLend.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
const VAULT_MGR = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].VaultManager;
function usePortfolioReads(address, prices) {
    const { data, isLoading, isError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: address ? [
            // 0: G$ balance
            {
                address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodDollarToken,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodDollarTokenABI"],
                functionName: 'balanceOf',
                args: [
                    address
                ]
            },
            // 1: gUSD balance
            {
                address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].gUSD,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERC20ABI"],
                functionName: 'balanceOf',
                args: [
                    address
                ]
            },
            // 2: GoodLend aggregate account data
            {
                address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodLendPool,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoodLendPoolABI"],
                functionName: 'getUserAccountData',
                args: [
                    address
                ]
            },
            // 3: ETH vault — vaults(ilk, owner) → (collateral, normalizedDebt)
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'vaults',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_ETH"],
                    address
                ]
            },
            // 4: ETH ilk accumulators(ilk) → (chi, lastDrip, totalNormalizedDebt)
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'accumulators',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_ETH"]
                ]
            },
            // 5: G$ vault
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'vaults',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_GD"],
                    address
                ]
            },
            // 6: G$ ilk accumulators
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'accumulators',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_GD"]
                ]
            },
            // 7: USDC vault
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'vaults',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_USDC"],
                    address
                ]
            },
            // 8: USDC ilk accumulators
            {
                address: VAULT_MGR,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VaultManagerABI"],
                functionName: 'accumulators',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_USDC"]
                ]
            }
        ] : [],
        allowFailure: true,
        query: {
            enabled: !!address,
            refetchInterval: 15_000
        }
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data) {
            return {
                gdBalance: 0,
                gusdBalance: 0,
                lend: null,
                ethVault: null,
                gdVault: null,
                usdcVault: null,
                isLoading,
                isError
            };
        }
        const gdRaw = data[0]?.result;
        const gusdRaw = data[1]?.result;
        const lendRaw = data[2]?.result;
        const ethVaultRaw = data[3]?.result;
        const ethAccRaw = data[4]?.result;
        const gdVaultRaw = data[5]?.result;
        const gdAccRaw = data[6]?.result;
        const usdcVaultRaw = data[7]?.result;
        const usdcAccRaw = data[8]?.result;
        const wethPx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPrice"])(prices, 'WETH');
        const gdPx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPrice"])(prices, 'G$');
        const usdcPx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPrice"])(prices, 'USDC');
        return {
            gdBalance: gdRaw !== undefined ? Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(gdRaw, 18)) : 0,
            gusdBalance: gusdRaw !== undefined ? Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatUnits"])(gusdRaw, 18)) : 0,
            lend: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodLend$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeAccountData"])(lendRaw),
            ethVault: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeVaultState"])(ethVaultRaw, ethAccRaw, 18, wethPx, 1.5),
            gdVault: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeVaultState"])(gdVaultRaw, gdAccRaw, 18, gdPx, 2.0),
            usdcVault: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeVaultState"])(usdcVaultRaw, usdcAccRaw, 6, usdcPx, 1.01),
            isLoading,
            isError
        };
    // We intentionally depend on `prices` (the object identity) rather than
    // its keys — the parent already memoizes `prices` inside usePriceFeeds
    // so identity stability is good, and listing keys risks missing one.
    }, [
        data,
        isLoading,
        isError,
        prices
    ]);
}
}),
"[project]/frontend/src/components/PortfolioOnChain.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PortfolioOnChain",
    ()=>PortfolioOnChain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * PortfolioOnChain — shows live on-chain positions when wallet is connected to chain 42069.
 *
 * Reads from (all batched into ONE multicall via `usePortfolioReads`):
 *   - GoodDollarToken.balanceOf  (G$ balance)
 *   - gUSD.balanceOf             (gUSD balance from GoodStable)
 *   - GoodLendPool.getUserAccountData (collateral, debt, health factor)
 *   - VaultManager × 3 ilks      (ETH, G$, USDC CDP vaults — vaults + accumulators)
 *
 * Before this refactor the panel held 6 separate `useReadContract`s totalling
 * 9 `eth_call`s every 15s tick. Now it's exactly one `multicall3.aggregate3`.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useGoodStable.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePortfolioReads$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePortfolioReads.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const CHAIN_ID = 42069;
const ILKS_META = [
    {
        key: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_ETH"],
        label: 'WETH',
        vaultKey: 'ethVault'
    },
    {
        key: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_GD"],
        label: 'G$',
        vaultKey: 'gdVault'
    },
    {
        key: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useGoodStable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ILK_USDC"],
        label: 'USDC',
        vaultKey: 'usdcVault'
    }
];
function fmtN(n, dp = 4) {
    if (!isFinite(n) || isNaN(n) || n === 0) return '0';
    if (n < 0.0001) return n.toExponential(2);
    return n.toFixed(dp);
}
function hfColor(hf) {
    if (!isFinite(hf)) return 'text-goodgreen';
    if (hf >= 2.0) return 'text-goodgreen';
    if (hf >= 1.5) return 'text-yellow-400';
    if (hf >= 1.1) return 'text-orange-400';
    return 'text-red-400';
}
// ─── G$ + gUSD balances row ───────────────────────────────────────────────────
function TokenBalances({ gdBalance, gusdBalance }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-50/30 rounded-xl px-4 py-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-400",
                                children: "G$ Balance"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-semibold text-white mt-0.5",
                                children: [
                                    fmtN(gdBalance, 2),
                                    " G$"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-8 h-8 rounded-full bg-goodgreen/10 flex items-center justify-center text-goodgreen text-xs font-bold",
                        children: "G$"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-50/30 rounded-xl px-4 py-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-400",
                                children: "gUSD Balance"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-semibold text-white mt-0.5",
                                children: [
                                    fmtN(gusdBalance, 2),
                                    " gUSD"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold",
                        children: "$"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
// ─── GoodLend position ────────────────────────────────────────────────────────
function LendPosition({ data, isLoading }) {
    const hasPosition = data && (data.totalCollateralFloat > 0 || data.totalDebtFloat > 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300 uppercase tracking-wider",
                        children: "GoodLend"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/lend",
                        className: "text-xs text-goodgreen hover:text-goodgreen/80 transition-colors",
                        children: "Manage →"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this),
            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-gray-500 py-2",
                children: "Loading…"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 86,
                columnNumber: 9
            }, this) : !hasPosition ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-gray-500 py-2 text-center",
                children: "No GoodLend positions"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 88,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-3 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-dark-50/30 rounded-xl px-3 py-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-400",
                                children: "Supplied"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-white",
                                children: [
                                    "$",
                                    fmtN(data.totalCollateralFloat, 2)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 93,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-dark-50/30 rounded-xl px-3 py-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-400",
                                children: "Borrowed"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-white",
                                children: [
                                    "$",
                                    fmtN(data.totalDebtFloat, 2)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-dark-50/30 rounded-xl px-3 py-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-400",
                                children: "Health"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `text-sm font-medium ${hfColor(data.healthFactorFloat)}`,
                                children: isFinite(data.healthFactorFloat) ? data.healthFactorFloat.toFixed(2) : '∞'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 101,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 99,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 90,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
// ─── GoodStable vault positions ───────────────────────────────────────────────
function StableVaultRow({ ilkMeta, vault, isLoading }) {
    const hasPosition = vault && (vault.collateralFloat > 0 || vault.actualDebtFloat > 0);
    if (!hasPosition && !isLoading) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-5 h-5 rounded-full bg-goodgreen/10 flex items-center justify-center text-goodgreen text-[9px] font-bold",
                        children: ilkMeta.label.slice(0, 2)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-white",
                        children: ilkMeta.label
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 text-right",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-500",
                                children: "Collateral"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-white",
                                children: isLoading ? '…' : `${fmtN(vault?.collateralFloat ?? 0, 3)} ${ilkMeta.label}`
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-500",
                                children: "Debt"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-white",
                                children: isLoading ? '…' : `${fmtN(vault?.actualDebtFloat ?? 0, 2)} gUSD`
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-gray-500",
                                children: "Health"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 135,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `text-xs font-medium ${hfColor(vault?.healthFactor ?? Infinity)}`,
                                children: isLoading ? '…' : isFinite(vault?.healthFactor ?? Infinity) ? (vault?.healthFactor ?? 0).toFixed(2) : '∞'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
        lineNumber: 118,
        columnNumber: 5
    }, this);
}
function StablePositions({ reads }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300 uppercase tracking-wider",
                        children: "GoodStable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/stable",
                        className: "text-xs text-goodgreen hover:text-goodgreen/80 transition-colors",
                        children: "Manage →"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 148,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-0.5",
                children: ILKS_META.map((ilk)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StableVaultRow, {
                        ilkMeta: ilk,
                        vault: reads[ilk.vaultKey],
                        isLoading: reads.isLoading
                    }, ilk.key, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 152,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
        lineNumber: 147,
        columnNumber: 5
    }, this);
}
function PortfolioOnChain() {
    const { address, chainId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccount"])();
    const { prices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePriceFeeds"])([
        'WETH',
        'G$',
        'USDC'
    ]);
    const reads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePortfolioReads$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePortfolioReads"])(address, prices);
    if (!address || chainId !== CHAIN_ID) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-100 rounded-2xl border border-goodgreen/20 p-5 mb-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-2 h-2 rounded-full bg-goodgreen animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold text-white",
                        children: "On-Chain Positions"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: "· devnet chain 42069"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TokenBalances, {
                gdBalance: reads.gdBalance,
                gusdBalance: reads.gusdBalance
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 183,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LendPosition, {
                data: reads.lend,
                isLoading: reads.isLoading
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 184,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StablePositions, {
                reads: reads
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PortfolioOnChain.tsx",
        lineNumber: 176,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/Sparkline.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sparkline",
    ()=>Sparkline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
;
const Sparkline = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["memo"])(function Sparkline({ data, width = 80, height = 32, positive = true, unavailableLabel = 'Price history unavailable' }) {
    // Unavailable data — render a faint dashed baseline placeholder.
    if (data === null || data === undefined || data.length === 0) {
        const midY = height / 2;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: width,
            height: height,
            viewBox: `0 0 ${width} ${height}`,
            className: "inline-block",
            role: "img",
            "aria-label": unavailableLabel,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: unavailableLabel
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/Sparkline.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: 2,
                    y1: midY,
                    x2: width - 2,
                    y2: midY,
                    stroke: "currentColor",
                    strokeOpacity: 0.25,
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                    strokeLinecap: "round"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/Sparkline.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/Sparkline.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this);
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const points = data.map((v, i)=>{
        const x = pad + i / (data.length - 1) * (width - pad * 2);
        const y = pad + (1 - (v - min) / range) * (height - pad * 2);
        return `${x},${y}`;
    }).join(' ');
    const color = positive ? '#4ade80' : '#f87171';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`,
        className: "inline-block",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
            points: points,
            fill: "none",
            stroke: color,
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/Sparkline.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/Sparkline.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
});
}),
"[project]/frontend/src/lib/stockLogos.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStockLogoUrl",
    ()=>getStockLogoUrl
]);
const STOCK_LOGO_DOMAINS = {
    AAPL: 'apple.com',
    TSLA: 'tesla.com',
    NVDA: 'nvidia.com',
    MSFT: 'microsoft.com',
    AMZN: 'amazon.com',
    GOOGL: 'google.com',
    META: 'meta.com',
    JPM: 'jpmorganchase.com',
    V: 'visa.com',
    DIS: 'thewaltdisneycompany.com',
    NFLX: 'netflix.com',
    AMD: 'amd.com'
};
function getStockLogoUrl(ticker) {
    if (process.env.NEXT_PUBLIC_ENABLE_CLEARBIT_LOGOS !== 'true') return null;
    const domain = STOCK_LOGO_DOMAINS[ticker.toUpperCase()];
    return domain ? `https://logo.clearbit.com/${domain}` : null;
}
}),
"[project]/frontend/src/components/ui/stock-logo.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StockLogo",
    ()=>StockLogo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockLogos$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockLogos.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs'
};
const imgSizes = {
    sm: 28,
    md: 40
};
function StockLogo({ ticker, size = 'sm' }) {
    const [failed, setFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const logoUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockLogos$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStockLogoUrl"])(ticker);
    const fallback = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${sizeClasses[size]} rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center font-bold text-goodgreen shrink-0`,
        children: ticker.slice(0, 2)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
    if (!logoUrl || failed) return fallback;
    const px = imgSizes[size];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${sizeClasses[size]} rounded-full overflow-hidden bg-white/10 border border-gray-700/20 shrink-0`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: logoUrl,
            alt: `${ticker} logo`,
            width: px,
            height: px,
            className: "w-full h-full object-cover",
            onError: ()=>setFailed(true),
            loading: "lazy"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
            lineNumber: 35,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/calculator-overlay.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CalculatorOverlay",
    ()=>CalculatorOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const CALCULATOR_BUTTONS = [
    [
        '7',
        '8',
        '9',
        '/'
    ],
    [
        '4',
        '5',
        '6',
        '*'
    ],
    [
        '1',
        '2',
        '3',
        '-'
    ],
    [
        '0',
        '.',
        '=',
        '+'
    ]
];
const PRESET_PERCENTAGES = [
    25,
    50,
    75,
    100
];
const PRESET_AMOUNTS = [
    10,
    100,
    1000,
    5000
];
function CalculatorOverlay({ isOpen, onClose, onValueSelect, currentValue, maxValue, maxValueLabel = 'max', className }) {
    const [expression, setExpression] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const overlayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOpen) {
            setExpression(currentValue || '');
            setResult('');
        }
    }, [
        isOpen,
        currentValue
    ]);
    // Close overlay when clicking outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleClickOutside = (event)=>{
            if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return ()=>document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [
        isOpen,
        onClose
    ]);
    const evaluateExpression = (expr)=>{
        try {
            // Replace common percentage patterns
            let cleanExpr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)') // Convert percentages
            .replace(/[^0-9+\-*/.() ]/g, '') // Remove invalid characters
            ;
            if (!cleanExpr || cleanExpr === '') return '';
            // Use Function constructor for safer evaluation than eval
            const result = new Function(`return ${cleanExpr}`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return result.toString();
            }
            return '';
        } catch  {
            return '';
        }
    };
    const handleButtonClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((value)=>{
        if (value === '=') {
            const evaluated = evaluateExpression(expression);
            if (evaluated) {
                onValueSelect(evaluated);
                onClose();
            }
        } else {
            const newExpression = expression + value;
            setExpression(newExpression);
            // Real-time evaluation for immediate feedback
            const evaluated = evaluateExpression(newExpression);
            setResult(evaluated);
        }
    }, [
        expression,
        onValueSelect,
        onClose
    ]);
    const handleCalculate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const evaluated = evaluateExpression(expression);
        if (evaluated) {
            onValueSelect(evaluated);
            onClose();
        }
    }, [
        expression,
        onValueSelect,
        onClose
    ]);
    const handleBackspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const newExpression = expression.slice(0, -1);
        setExpression(newExpression);
        const evaluated = evaluateExpression(newExpression);
        setResult(evaluated);
    }, [
        expression
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (!isOpen) return;
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleCalculate();
        } else if (/[0-9+\-*/.=]/.test(e.key)) {
            e.preventDefault();
            handleButtonClick(e.key);
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
        }
    }, [
        isOpen,
        onClose,
        handleCalculate,
        handleButtonClick,
        handleBackspace
    ]);
    // Keyboard support
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        window.addEventListener('keydown', handleKeyDown);
        return ()=>window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleKeyDown
    ]);
    const handleClear = ()=>{
        setExpression('');
        setResult('');
    };
    const handlePercentage = (percent)=>{
        if (maxValue !== undefined) {
            const value = (maxValue * percent / 100).toString();
            onValueSelect(value);
            onClose();
        }
    };
    const handlePresetAmount = (amount)=>{
        onValueSelect(amount.toString());
        onClose();
    };
    if (!isOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: overlayRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "calculator-title",
            "aria-describedby": "calculator-description",
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('bg-dark-100 rounded-2xl border border-gray-700/20 p-4 w-full max-w-sm shadow-2xl', className),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    id: "calculator-description",
                    className: "sr-only",
                    children: "Interactive calculator for amount inputs with basic arithmetic operations, percentage calculations, and preset amounts"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 182,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            id: "calculator-title",
                            className: "text-sm font-semibold text-white",
                            children: "Calculator"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 187,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            "aria-label": "Close calculator",
                            className: "p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-4 h-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 194,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                lineNumber: 193,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 188,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 186,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-50 rounded-xl p-3 mb-4",
                    role: "region",
                    "aria-labelledby": "calculator-display",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "calculator-display",
                            className: "text-xs text-gray-400 mb-1",
                            children: "Expression:"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-white font-mono text-sm min-h-[20px]",
                            "aria-label": `Current expression: ${expression || '0'}`,
                            children: expression || '0'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this),
                        result && result !== expression && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mt-2 mb-1",
                                    children: "Result:"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 207,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-goodgreen font-mono text-sm",
                                    "aria-live": "polite",
                                    "aria-label": `Calculation result: ${result}`,
                                    children: [
                                        "= ",
                                        result
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 200,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-2 mb-4",
                    children: [
                        maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "col-span-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mb-2",
                                    children: [
                                        "% of ",
                                        maxValueLabel,
                                        ":"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 224,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-4 gap-1",
                                    children: PRESET_PERCENTAGES.map((percent)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handlePercentage(percent),
                                            "aria-label": `Use ${percent}% of ${maxValueLabel}`,
                                            className: "py-2 px-2 rounded-lg bg-gray-700/30 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600/40 transition-colors",
                                            children: [
                                                percent,
                                                "%"
                                            ]
                                        }, percent, true, {
                                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                            lineNumber: 227,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 225,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 223,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "col-span-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mb-2",
                                    children: "Quick amounts:"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-4 gap-1",
                                    children: PRESET_AMOUNTS.map((amount)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handlePresetAmount(amount),
                                            "aria-label": `Use preset amount ${amount}`,
                                            className: "py-2 px-2 rounded-lg bg-gray-700/30 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600/40 transition-colors",
                                            children: amount >= 1000 ? `${amount / 1000}K` : amount
                                        }, amount, false, {
                                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                            lineNumber: 245,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 243,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 241,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 220,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-4 gap-2 mb-4",
                    role: "grid",
                    "aria-labelledby": "calculator-grid-label",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "calculator-grid-label",
                            className: "sr-only",
                            children: "Calculator number pad and operations"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 260,
                            columnNumber: 11
                        }, this),
                        CALCULATOR_BUTTONS.flat().map((btn, index)=>{
                            let ariaLabel = '';
                            if (btn === '=') ariaLabel = 'Calculate result';
                            else if (btn === '+') ariaLabel = 'Add';
                            else if (btn === '-') ariaLabel = 'Subtract';
                            else if (btn === '*') ariaLabel = 'Multiply';
                            else if (btn === '/') ariaLabel = 'Divide';
                            else if (btn === '.') ariaLabel = 'Decimal point';
                            else ariaLabel = `Number ${btn}`;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleButtonClick(btn),
                                "aria-label": ariaLabel,
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('aspect-square rounded-lg font-medium transition-colors text-sm', btn === '=' ? 'bg-goodgreen text-black hover:bg-goodgreen/80' : [
                                    '+',
                                    '-',
                                    '*',
                                    '/'
                                ].includes(btn) ? 'bg-gray-600/40 text-gray-200 hover:text-white hover:bg-gray-500/50' : 'bg-gray-700/30 text-gray-300 hover:text-white hover:bg-gray-600/40'),
                                children: btn
                            }, `${btn}-${index}`, false, {
                                fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                lineNumber: 272,
                                columnNumber: 15
                            }, this);
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 259,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleClear,
                            "aria-label": "Clear all input",
                            className: "py-2 px-3 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 hover:text-red-300 transition-colors",
                            children: "Clear"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleBackspace,
                            "aria-label": "Delete last character",
                            className: "py-2 px-3 rounded-lg bg-gray-700/30 text-gray-300 text-xs font-medium hover:text-white hover:bg-gray-600/40 transition-colors",
                            children: "⌫"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 300,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleCalculate,
                            "aria-label": "Apply calculated result to input field",
                            className: "py-2 px-3 rounded-lg bg-goodgreen text-black text-xs font-medium hover:bg-goodgreen/80 transition-colors",
                            children: "Apply"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 307,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 292,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
            lineNumber: 171,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
        lineNumber: 170,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/frontend/src/lib/formatCompactCaption.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatCompactCaption",
    ()=>formatCompactCaption,
    "formatCompactUsdCaption",
    ()=>formatCompactUsdCaption
]);
/**
 * Compact number formatters for `AmountInput` auxiliary captions.
 *
 * `Intl.NumberFormat` (via `Number.prototype.toLocaleString`) silently
 * falls back to scientific notation when the integer part exceeds ~21
 * digits, and renders unreasonably wide grouped strings well before
 * that. The `AmountInput` caption row was designed for short labels
 * like `balance: 1,234.56 USDC`, not for `9.9999999999999e+21`. When a
 * user lands on a low-priced pair on `/perps` (SHIB-class assets) the
 * leverage-adjusted maximum position size easily exceeds
 * `Number.MAX_SAFE_INTEGER`, producing scientific notation that wraps,
 * overflows its container, and breaks the visual hierarchy of the
 * order summary panel.
 *
 * These helpers mirror the K/M/B/T/Q suffix vocabulary already used by
 * `formatPerpsPrice()` and `formatLargeValue()` in `perpsData.ts` so
 * the visual language stays consistent across the trading UI. They
 * differ in two ways:
 *
 *   1. `formatCompactCaption` is unit-less because the caption row
 *      already supplies its own `{symbol}` suffix.
 *   2. Non-finite inputs (`Infinity`, `NaN`) render as an em-dash
 *      placeholder instead of emitting the literal string `"Infinity"`
 *      or `"NaN"`.
 */ const TIERS = [
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
    ]
];
function pickDecimals(v) {
    return v >= 100 ? 0 : v >= 10 ? 1 : 2;
}
function formatCompactCaption(n, fractionDigits = 4) {
    if (!Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of TIERS){
        if (abs >= threshold) {
            const v = abs / threshold;
            return `${sign}${v.toFixed(pickDecimals(v))}${suffix}`;
        }
    }
    return n.toLocaleString('en-US', {
        minimumFractionDigits: Math.min(2, fractionDigits),
        maximumFractionDigits: fractionDigits
    });
}
function formatCompactUsdCaption(n) {
    if (!Number.isFinite(n)) return '$—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of TIERS){
        if (abs >= threshold) {
            const v = abs / threshold;
            return `${sign}$${v.toFixed(pickDecimals(v))}${suffix}`;
        }
    }
    return `${sign}$${abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
}),
"[project]/frontend/src/components/ui/amount-input.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AmountInput",
    ()=>AmountInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$calculator$2d$overlay$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/calculator-overlay.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/formatCompactCaption.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
/**
 * Enhanced amount input component with integrated calculator overlay.
 *
 * Features:
 * - Built-in calculator overlay with arithmetic operations
 * - Percentage calculations based on max available amount
 * - Quick preset amounts and max button
 * - USD value display for context
 * - Input validation and sanitization
 * - Consistent styling across all trading interfaces
 * - Accessibility support with keyboard navigation
 *
 * Used across: SwapCard, Perps, Lending, Bridge, Yield farming
 */ const AmountInput = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ value, onChange, maxValue, maxValueLabel = 'balance', showCalculator = true, showMaxButton = true, symbol, usdValue, error, className, placeholder = '0.00', ...props }, ref)=>{
    const [isCalculatorOpen, setIsCalculatorOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleCalculatorValue = (calculatedValue)=>{
        onChange(calculatedValue);
    };
    const handleMaxClick = ()=>{
        if (maxValue !== undefined) {
            onChange(maxValue.toString());
        }
    };
    const handleInputChange = (e)=>{
        onChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value));
    };
    const hasError = !!error;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative flex items-center', 'bg-dark-50 border rounded-xl', 'focus-within:ring-2 focus-within:ring-goodgreen/50', hasError ? 'border-red-500/50 focus-within:border-red-500/50' : 'border-gray-700/30 focus-within:border-goodgreen/30'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: ref,
                        type: "text",
                        inputMode: "decimal",
                        value: value,
                        onChange: handleInputChange,
                        placeholder: placeholder,
                        className: "flex-1 px-3 py-2.5 bg-transparent text-white text-sm outline-none placeholder:text-gray-500",
                        ...props
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 83,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1 px-2",
                        children: [
                            symbol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400 mr-1",
                                children: symbol
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 98,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            showMaxButton && maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleMaxClick,
                                className: "px-2 py-1 rounded-md text-xs font-medium text-goodgreen hover:text-goodgreen-400 hover:bg-goodgreen/10 transition-colors",
                                children: "MAX"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 105,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            showCalculator && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setIsCalculatorOpen(true),
                                className: "p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors",
                                title: "Open calculator",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                        lineNumber: 123,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                    lineNumber: 122,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 116,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 74,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-1 px-1",
                children: [
                    usdValue !== undefined && value && parseFloat(value) > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            "≈ ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCompactUsdCaption"])(usdValue)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 134,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            maxValueLabel,
                            ": ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCompactCaption"])(maxValue),
                            symbol && ` ${symbol}`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 141,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            error && typeof error === 'string' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-400 text-xs mt-1 px-1",
                children: error
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 150,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$calculator$2d$overlay$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CalculatorOverlay"], {
                isOpen: isCalculatorOpen,
                onClose: ()=>setIsCalculatorOpen(false),
                onValueSelect: handleCalculatorValue,
                currentValue: value,
                maxValue: maxValue,
                maxValueLabel: maxValueLabel
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 156,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
        lineNumber: 73,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
AmountInput.displayName = 'AmountInput';
;
}),
"[project]/frontend/src/components/ui/animated-number.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedNumber",
    ()=>AnimatedNumber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-transform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
function AnimatedNumber({ value, decimals = 2, className }) {
    const motionValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMotionValue"])(value);
    const spring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSpring"])(motionValue, {
        stiffness: 80,
        damping: 20
    });
    const display = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransform"])(spring, (v)=>v.toFixed(decimals));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        motionValue.set(value);
    }, [
        value,
        motionValue
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].span, {
        className: className,
        children: display
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/animated-number.tsx",
        lineNumber: 22,
        columnNumber: 10
    }, this);
}
}),
"[project]/frontend/src/components/ui/badge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors', {
    variants: {
        variant: {
            default: 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20',
            secondary: 'bg-muted text-muted-foreground border border-border',
            outline: 'border border-border text-foreground',
            destructive: 'bg-red-500/10 text-red-400 border border-red-500/20',
            warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
            success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});
function Badge({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/badge.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/frontend/src/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]', {
    variants: {
        variant: {
            default: 'bg-goodgreen text-dark font-semibold hover:bg-goodgreen-600 active:bg-goodgreen-700',
            secondary: 'bg-dark-50 text-foreground hover:bg-dark-100 border border-border',
            outline: 'border border-goodgreen text-goodgreen bg-transparent hover:bg-goodgreen/10',
            ghost: 'text-foreground hover:bg-dark-50 hover:text-white',
            destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
            link: 'text-goodgreen underline-offset-4 hover:underline p-0 h-auto'
        },
        size: {
            sm: 'h-8 px-3 text-xs rounded',
            default: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-base rounded-lg',
            icon: 'h-10 w-10',
            'icon-sm': 'h-8 w-8'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant, size, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/button.tsx",
        lineNumber: 47,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
Button.displayName = 'Button';
;
}),
"[project]/frontend/src/components/ui/card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-border bg-card text-card-foreground shadow', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 8,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
Card.displayName = 'Card';
const CardHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex flex-col space-y-1.5 p-6', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 23,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
CardHeader.displayName = 'CardHeader';
const CardTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('font-semibold leading-none tracking-tight', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 35,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
CardTitle.displayName = 'CardTitle';
const CardDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-sm text-muted-foreground', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 47,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
CardDescription.displayName = 'CardDescription';
const CardContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('p-6 pt-0', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 59,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
CardContent.displayName = 'CardContent';
const CardFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-center p-6 pt-0', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/card.tsx",
        lineNumber: 67,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
CardFooter.displayName = 'CardFooter';
;
}),
"[project]/frontend/src/components/ui/dialog.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dialog",
    ()=>Dialog,
    "DialogClose",
    ()=>DialogClose,
    "DialogContent",
    ()=>DialogContent,
    "DialogDescription",
    ()=>DialogDescription,
    "DialogFooter",
    ()=>DialogFooter,
    "DialogHeader",
    ()=>DialogHeader,
    "DialogOverlay",
    ()=>DialogOverlay,
    "DialogPortal",
    ()=>DialogPortal,
    "DialogTitle",
    ()=>DialogTitle,
    "DialogTrigger",
    ()=>DialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const Dialog = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const DialogTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"];
const DialogPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"];
const DialogClose = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"];
const DialogOverlay = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Overlay"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('fixed inset-0 z-50 bg-black/60 backdrop-blur-sm', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 17,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DialogOverlay.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Overlay"].displayName;
const DialogContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {}, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/dialog.tsx",
                lineNumber: 35,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
                ref: ref,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]', 'w-full max-w-lg border border-border bg-card shadow-lg rounded-xl p-6', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', 'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]', 'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]', 'duration-200', className),
                ...props,
                children: [
                    children,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"], {
                        className: "absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/dialog.tsx",
                                lineNumber: 53,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/dialog.tsx",
                                lineNumber: 54,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
                        lineNumber: 52,
                        columnNumber: 7
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/dialog.tsx",
                lineNumber: 36,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 34,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DialogContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
const DialogHeader = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex flex-col space-y-1.5 mb-4', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
DialogHeader.displayName = 'DialogHeader';
const DialogFooter = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex justify-end gap-3 mt-6', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 67,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
DialogFooter.displayName = 'DialogFooter';
const DialogTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-lg font-semibold leading-none tracking-tight', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 75,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DialogTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"].displayName;
const DialogDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-sm text-muted-foreground', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dialog.tsx",
        lineNumber: 87,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DialogDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"].displayName;
;
}),
"[project]/frontend/src/components/ui/dropdown-menu.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DropdownMenu",
    ()=>DropdownMenu,
    "DropdownMenuCheckboxItem",
    ()=>DropdownMenuCheckboxItem,
    "DropdownMenuContent",
    ()=>DropdownMenuContent,
    "DropdownMenuGroup",
    ()=>DropdownMenuGroup,
    "DropdownMenuItem",
    ()=>DropdownMenuItem,
    "DropdownMenuLabel",
    ()=>DropdownMenuLabel,
    "DropdownMenuPortal",
    ()=>DropdownMenuPortal,
    "DropdownMenuRadioGroup",
    ()=>DropdownMenuRadioGroup,
    "DropdownMenuRadioItem",
    ()=>DropdownMenuRadioItem,
    "DropdownMenuSeparator",
    ()=>DropdownMenuSeparator,
    "DropdownMenuSub",
    ()=>DropdownMenuSub,
    "DropdownMenuSubContent",
    ()=>DropdownMenuSubContent,
    "DropdownMenuSubTrigger",
    ()=>DropdownMenuSubTrigger,
    "DropdownMenuTrigger",
    ()=>DropdownMenuTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-ssr] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const DropdownMenu = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const DropdownMenuTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"];
const DropdownMenuGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"];
const DropdownMenuPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"];
const DropdownMenuSub = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sub"];
const DropdownMenuRadioGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioGroup"];
const DropdownMenuSubTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubTrigger"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none', 'focus:bg-muted data-[state=open]:bg-muted', inset && 'pl-8', className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                className: "ml-auto h-4 w-4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                lineNumber: 30,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 19,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSubTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubTrigger"].displayName;
const DropdownMenuSubContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubContent"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-foreground shadow-lg', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', 'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2', 'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSubContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubContent"].displayName;
const DropdownMenuContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-foreground shadow-md', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', 'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2', 'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', className),
            ...props
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
            lineNumber: 60,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 59,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
const DropdownMenuItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Item"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors', 'focus:bg-muted focus:text-foreground', 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50', inset && 'pl-8', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 82,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Item"].displayName;
const DropdownMenuCheckboxItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, children, checked, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CheckboxItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors', 'focus:bg-muted focus:text-foreground', 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className),
        checked: checked,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                    lineNumber: 112,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                lineNumber: 111,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 100,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuCheckboxItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CheckboxItem"].displayName;
const DropdownMenuRadioItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors', 'focus:bg-muted focus:text-foreground', 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
                        className: "h-2 w-2 fill-current"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                    lineNumber: 136,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
                lineNumber: 135,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 125,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuRadioItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioItem"].displayName;
const DropdownMenuLabel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('px-2 py-1.5 text-xs font-semibold text-muted-foreground', inset && 'pl-8', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 149,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuLabel.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"].displayName;
const DropdownMenuSeparator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Separator"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('-mx-1 my-1 h-px bg-border', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/dropdown-menu.tsx",
        lineNumber: 161,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSeparator.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Separator"].displayName;
;
}),
"[project]/frontend/src/components/ui/empty-state.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EmptyState",
    ()=>EmptyState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/button.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function EmptyState({ icon, title, description, action, className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex flex-col items-center justify-center text-center py-6 px-4', className),
        "data-testid": "empty-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/20 to-goodgreen/5 border border-goodgreen/15 flex items-center justify-center text-goodgreen mb-3",
                children: icon
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-white",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400 mt-1 max-w-xs",
                children: description
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, this),
            action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                href: action.href,
                className: "mt-3 inline-flex",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                    variant: "ghost",
                    size: "sm",
                    children: action.label
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                    lineNumber: 48,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 47,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/enhanced-animated-number.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedCurrency",
    ()=>AnimatedCurrency,
    "AnimatedLargeNumber",
    ()=>AnimatedLargeNumber,
    "AnimatedPercentage",
    ()=>AnimatedPercentage,
    "EnhancedAnimatedNumber",
    ()=>EnhancedAnimatedNumber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const animationConfigs = {
    smooth: {
        stiffness: 60,
        damping: 20
    },
    bounce: {
        stiffness: 120,
        damping: 10
    },
    elastic: {
        stiffness: 200,
        damping: 12
    },
    spring: {
        stiffness: 80,
        damping: 20
    }
};
function EnhancedAnimatedNumber({ value, decimals = 2, prefix = '', suffix = '', variant = 'spring', duration = 1000, highlightChange = false, formatter, className }) {
    const motionValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMotionValue"])(value);
    const prevValueRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(value);
    const config = animationConfigs[variant];
    const [displayValue, setDisplayValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        if (formatter) {
            return formatter(value);
        }
        return value.toFixed(decimals);
    });
    // Create spring animation with custom config
    const spring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSpring"])(motionValue, {
        ...config,
        restDelta: 0.01 // Smaller rest delta for smoother stopping
    });
    // Detect value changes for highlight effect
    const isPositiveChange = highlightChange && value > prevValueRef.current;
    const isNegativeChange = highlightChange && value < prevValueRef.current;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        motionValue.set(value);
        prevValueRef.current = value;
    }, [
        value,
        motionValue
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const unsubscribe = spring.on('change', (latest)=>{
            if (formatter) {
                setDisplayValue(formatter(latest));
            } else {
                setDisplayValue(latest.toFixed(decimals));
            }
        });
        return ()=>unsubscribe();
    }, [
        spring,
        formatter,
        decimals
    ]);
    const changeColor = isPositiveChange ? 'text-green-400' : isNegativeChange ? 'text-red-400' : '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
        mode: "wait",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].span, {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('tabular-nums', changeColor, className),
            initial: highlightChange ? {
                scale: 1
            } : false,
            animate: highlightChange && (isPositiveChange || isNegativeChange) ? {
                scale: [
                    1,
                    1.05,
                    1
                ],
                transition: {
                    duration: 0.3,
                    ease: 'easeOut'
                }
            } : {
                scale: 1
            },
            children: [
                prefix,
                displayValue,
                suffix
            ]
        }, value, true, {
            fileName: "[project]/frontend/src/components/ui/enhanced-animated-number.tsx",
            lineNumber: 89,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/enhanced-animated-number.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
function AnimatedCurrency({ value, currency = 'USD', locale = 'en-US', ...props }) {
    const formatter = (num)=>new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: props.decimals ?? 2,
            maximumFractionDigits: props.decimals ?? 2
        }).format(num);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EnhancedAnimatedNumber, {
        ...props,
        value: value,
        formatter: formatter
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/enhanced-animated-number.tsx",
        lineNumber: 125,
        columnNumber: 5
    }, this);
}
function AnimatedPercentage({ value, showSign = true, ...props }) {
    const prefix = showSign && value > 0 ? '+' : '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EnhancedAnimatedNumber, {
        ...props,
        value: value,
        prefix: prefix,
        suffix: "%",
        highlightChange: true
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/enhanced-animated-number.tsx",
        lineNumber: 144,
        columnNumber: 5
    }, this);
}
function AnimatedLargeNumber({ value, ...props }) {
    const formatter = (num)=>{
        const absNum = Math.abs(num);
        if (absNum >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (absNum >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (absNum >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toFixed(props.decimals ?? 0);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EnhancedAnimatedNumber, {
        ...props,
        value: value,
        formatter: formatter
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/enhanced-animated-number.tsx",
        lineNumber: 172,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/gesture-button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DangerButton",
    ()=>DangerButton,
    "GestureButton",
    ()=>GestureButton,
    "SwapButton",
    ()=>SwapButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-transform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const variants = {
    primary: 'bg-goodgreen hover:bg-goodgreen/90 text-dark',
    secondary: 'bg-dark-50 hover:bg-dark-100 text-white border border-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
};
const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
};
// Haptic feedback utility
const triggerHaptic = (pattern = 'light')=>{
    if ('vibrate' in navigator) {
        const patterns = {
            light: [
                10
            ],
            medium: [
                20
            ],
            heavy: [
                50
            ]
        };
        navigator.vibrate(patterns[pattern]);
    }
};
const GestureButton = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ children, onClick, onLongPress, onSwipeRight, onSwipeLeft, enableHaptics = false, variant = 'primary', size = 'md', loading = false, disabled = false, longPressDuration = 800, swipeThreshold = 50, showSuccessFeedback = false, showErrorFeedback = false, className, ...props }, ref)=>{
    const [isPressed, setIsPressed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLongPressing, setIsLongPressing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const longPressTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    const x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMotionValue"])(0);
    const opacity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransform"])(x, [
        -100,
        0,
        100
    ], [
        0.6,
        1,
        0.6
    ]);
    const scale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTransform"])(x, [
        -50,
        0,
        50
    ], [
        0.95,
        1,
        0.95
    ]);
    const handleTapStart = ()=>{
        if (disabled || loading) return;
        setIsPressed(true);
        if (enableHaptics) triggerHaptic('light');
        // Start long press timer
        if (onLongPress) {
            longPressTimer.current = setTimeout(()=>{
                setIsLongPressing(true);
                if (enableHaptics) triggerHaptic('medium');
                onLongPress();
            }, longPressDuration);
        }
    };
    const handleTapEnd = ()=>{
        setIsPressed(false);
        setIsLongPressing(false);
        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };
    const handleTap = ()=>{
        if (disabled || loading || isLongPressing) return;
        if (enableHaptics) triggerHaptic('medium');
        onClick?.();
    };
    const handlePan = (event, info)=>{
        if (disabled || loading) return;
        const { offset, velocity } = info;
        if (Math.abs(offset.x) > swipeThreshold) {
            if (offset.x > 0 && onSwipeRight) {
                if (enableHaptics) triggerHaptic('heavy');
                onSwipeRight();
            } else if (offset.x < 0 && onSwipeLeft) {
                if (enableHaptics) triggerHaptic('heavy');
                onSwipeLeft();
            }
        }
    };
    const handlePanEnd = ()=>{
        x.set(0); // Reset position
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative font-semibold rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none overflow-hidden', variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed', loading && 'cursor-wait', className),
        style: {
            x,
            opacity,
            scale
        },
        disabled: disabled || loading,
        onTapStart: handleTapStart,
        onTap: handleTap,
        onTapCancel: handleTapEnd,
        onPan: handlePan,
        onPanEnd: handlePanEnd,
        whileTap: !disabled && !loading ? {
            scale: 0.98
        } : {},
        animate: {
            // Success pulse animation
            ...showSuccessFeedback && {
                scale: [
                    1,
                    1.05,
                    1
                ],
                boxShadow: [
                    '0 0 0 0px rgba(34, 197, 94, 0)',
                    '0 0 0 8px rgba(34, 197, 94, 0.3)',
                    '0 0 0 0px rgba(34, 197, 94, 0)'
                ],
                transition: {
                    duration: 0.6,
                    ease: 'easeOut'
                }
            },
            // Error shake animation
            ...showErrorFeedback && {
                x: [
                    -5,
                    5,
                    -5,
                    5,
                    0
                ],
                transition: {
                    duration: 0.4,
                    ease: 'easeOut'
                }
            }
        },
        ...props,
        children: [
            onLongPress && isPressed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute inset-0 bg-white/20",
                initial: {
                    scaleX: 0
                },
                animate: {
                    scaleX: isLongPressing ? 1 : 0
                },
                transition: {
                    duration: longPressDuration / 1000,
                    ease: 'linear'
                },
                style: {
                    originX: 0
                }
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                lineNumber: 178,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute inset-0 flex items-center justify-center bg-inherit",
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    duration: 0.2
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                    className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full",
                    animate: {
                        rotate: 360
                    },
                    transition: {
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear'
                    }
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                    lineNumber: 195,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                lineNumber: 189,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "flex items-center justify-center gap-2",
                animate: {
                    opacity: loading ? 0 : 1
                },
                transition: {
                    duration: 0.2
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            (onSwipeLeft || onSwipeRight) && !loading && !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    onSwipeLeft && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-50",
                        initial: {
                            opacity: 0,
                            x: 10
                        },
                        animate: {
                            opacity: 0.5,
                            x: 0
                        },
                        transition: {
                            delay: 2,
                            duration: 0.3
                        },
                        children: "←"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                        lineNumber: 216,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    onSwipeRight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50",
                        initial: {
                            opacity: 0,
                            x: -10
                        },
                        animate: {
                            opacity: 0.5,
                            x: 0
                        },
                        transition: {
                            delay: 2,
                            duration: 0.3
                        },
                        children: "→"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                        lineNumber: 226,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true),
            isPressed && !disabled && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute inset-0 bg-white/20 rounded-xl",
                initial: {
                    scale: 0,
                    opacity: 0.6
                },
                animate: {
                    scale: 2,
                    opacity: 0
                },
                transition: {
                    duration: 0.4,
                    ease: 'easeOut'
                }
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
                lineNumber: 240,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
GestureButton.displayName = 'GestureButton';
const SwapButton = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ onFlipTokens, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GestureButton, {
        ref: ref,
        variant: "primary",
        onSwipeRight: onFlipTokens,
        enableHaptics: true,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
        lineNumber: 257,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SwapButton.displayName = 'SwapButton';
const DangerButton = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GestureButton, {
        ref: ref,
        variant: "danger",
        longPressDuration: 1200,
        enableHaptics: true,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/gesture-button.tsx",
        lineNumber: 270,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0)));
DangerButton.displayName = 'DangerButton';
}),
"[project]/frontend/src/components/ui/input.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm', 'placeholder:text-muted-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', 'disabled:cursor-not-allowed disabled:opacity-50', 'transition-colors', className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/input.tsx",
        lineNumber: 9,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
Input.displayName = 'Input';
;
}),
"[project]/frontend/src/components/ui/percentage-change.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PercentageChange",
    ()=>PercentageChange,
    "percentageChangeVariants",
    ()=>percentageChangeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const percentageChangeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center gap-1 font-medium transition-colors', {
    variants: {
        variant: {
            default: 'text-foreground',
            positive: 'text-green-400',
            negative: 'text-red-400',
            muted: 'text-muted-foreground',
            subtle: 'text-muted-foreground'
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg'
        },
        showIcon: {
            true: '',
            false: ''
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'sm',
        showIcon: true
    }
});
/**
 * Standardized percentage change component for financial data.
 *
 * Features:
 * - Automatic positive/negative styling and icons
 * - Configurable decimal precision
 * - Optional +/- sign display
 * - Consistent with design system
 * - Triangle icons for visual clarity
 * - Null-safe: renders "—" when value is null/undefined (data unavailable)
 *
 * Used across: GoodSwap, GoodStocks, GoodPredict, GoodPerps
 */ const PercentageChange = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ value, decimals = 2, showSign = false, showIcon = true, variant, size, className, unavailableLabel = 'Data unavailable', ...props }, ref)=>{
    // Unavailable (null/undefined) — render neutral placeholder with tooltip.
    if (value === null || value === undefined) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            ref: ref,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(percentageChangeVariants({
                variant: 'muted',
                size,
                showIcon: false
            }), className),
            title: unavailableLabel,
            "aria-label": unavailableLabel,
            ...props,
            children: "—"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
            lineNumber: 80,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Auto-detect positive/negative variant if not specified
    const isPositive = value > 0;
    const isNegative = value < 0;
    const finalVariant = variant || (isPositive ? 'positive' : isNegative ? 'negative' : 'muted');
    const formattedValue = Math.abs(value).toFixed(decimals);
    const sign = showSign && value !== 0 ? isPositive ? '+' : '-' : '';
    const TriangleIcon = ({ direction })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-2.5 h-2.5",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            children: direction === 'up' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 5l8 14H4L12 5z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 111,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 19L4 5h16L12 19z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 113,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
            lineNumber: 104,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(percentageChangeVariants({
            variant: finalVariant,
            size,
            showIcon
        }), className),
        ...props,
        children: [
            showIcon && value !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TriangleIcon, {
                direction: isPositive ? 'up' : 'down'
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 125,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    sign,
                    formattedValue,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
        lineNumber: 119,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
PercentageChange.displayName = 'PercentageChange';
;
}),
"[project]/frontend/src/components/ui/price-display.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceDisplay",
    ()=>PriceDisplay,
    "priceDisplayVariants",
    ()=>priceDisplayVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/animated-number.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const priceDisplayVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('font-medium transition-colors', {
    variants: {
        variant: {
            default: 'text-foreground',
            positive: 'text-green-400',
            negative: 'text-red-400',
            muted: 'text-muted-foreground',
            accent: 'text-goodgreen'
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'md'
    }
});
/**
 * Standardized price display component for financial data across all dApps.
 *
 * Features:
 * - Automatic positive/negative variant detection
 * - Configurable decimal precision
 * - Optional animation for live price updates
 * - Compact formatting for large numbers
 * - Contextual timing labels (e.g., "vs 24h ago", "since yesterday")
 * - Consistent styling with design system
 *
 * Used across: GoodSwap, GoodStocks, GoodPredict, GoodPerps
 */ const PriceDisplay = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ value, symbol = '', prefix = '', decimals = 2, showSign = false, animated = false, compact = false, contextLabel, showContext = false, variant, size, className, ...props }, ref)=>{
    // Auto-detect positive/negative variant if not specified
    const finalVariant = variant || (value > 0 ? 'positive' : value < 0 ? 'negative' : 'default');
    // Format the number
    const formatNumber = (num)=>{
        if (compact && Math.abs(num) >= 1000) {
            if (Math.abs(num) >= 1_000_000_000) {
                return (num / 1_000_000_000).toFixed(1) + 'B';
            } else if (Math.abs(num) >= 1_000_000) {
                return (num / 1_000_000).toFixed(1) + 'M';
            } else if (Math.abs(num) >= 1_000) {
                return (num / 1_000).toFixed(1) + 'K';
            }
        }
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };
    const formattedValue = formatNumber(Math.abs(value));
    const sign = showSign && value !== 0 ? value > 0 ? '+' : '-' : '';
    // Determine contextual label text and styling
    const getContextLabel = ()=>{
        if (!showContext) return null;
        // Use provided contextLabel or smart defaults based on value
        const labelText = contextLabel || (showSign ? 'vs 24h ago' : 'current');
        return labelText;
    };
    const contextLabelText = getContextLabel();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(priceDisplayVariants({
            variant: finalVariant,
            size
        }), className),
        ...props,
        children: [
            prefix,
            sign,
            animated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatedNumber"], {
                value: Math.abs(value),
                decimals: decimals,
                className: "inline"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 124,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : formattedValue,
            symbol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-1 text-muted-foreground text-[0.85em]",
                children: symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 133,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            contextLabelText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-1.5 text-gray-400 text-[0.75em]",
                children: contextLabelText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 138,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/price-display.tsx",
        lineNumber: 116,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
PriceDisplay.displayName = 'PriceDisplay';
;
}),
"[project]/frontend/src/components/ui/risk-indicator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RiskIndicator",
    ()=>RiskIndicator,
    "dotVariants",
    ()=>dotVariants,
    "getHealthFactorRisk",
    ()=>getHealthFactorRisk,
    "getLiquidationRisk",
    ()=>getLiquidationRisk,
    "getPositionPnLRisk",
    ()=>getPositionPnLRisk,
    "riskIndicatorVariants",
    ()=>riskIndicatorVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
;
;
;
const riskIndicatorVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center gap-1.5 text-xs font-medium', {
    variants: {
        variant: {
            safe: 'text-green-400',
            warning: 'text-yellow-400',
            danger: 'text-red-400',
            neutral: 'text-gray-400'
        },
        size: {
            sm: 'text-xs',
            default: 'text-xs',
            lg: 'text-sm'
        }
    },
    defaultVariants: {
        variant: 'neutral',
        size: 'default'
    }
});
const dotVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])('rounded-full flex-shrink-0', {
    variants: {
        variant: {
            safe: 'bg-green-400',
            warning: 'bg-yellow-400',
            danger: 'bg-red-400',
            neutral: 'bg-gray-400'
        },
        size: {
            sm: 'w-1.5 h-1.5',
            default: 'w-2 h-2',
            lg: 'w-2.5 h-2.5'
        },
        animated: {
            true: 'animate-pulse',
            false: ''
        }
    },
    defaultVariants: {
        variant: 'neutral',
        size: 'default',
        animated: false
    }
});
function RiskIndicator({ className, variant, size, label, value, animated = false, dotOnly = false, ...props }) {
    if (dotOnly) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(dotVariants({
                variant,
                size,
                animated
            }), className),
            title: label,
            ...props
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/risk-indicator.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(riskIndicatorVariants({
            variant,
            size
        }), className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(dotVariants({
                    variant,
                    size,
                    animated
                }))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/risk-indicator.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this),
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/risk-indicator.tsx",
                lineNumber: 87,
                columnNumber: 17
            }, this),
            value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-semibold",
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/risk-indicator.tsx",
                lineNumber: 88,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/risk-indicator.tsx",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
function getHealthFactorRisk(healthFactor) {
    if (healthFactor >= 2) return 'safe';
    if (healthFactor >= 1.2) return 'warning';
    return 'danger';
}
function getLiquidationRisk(currentPrice, liquidationPrice) {
    const distance = Math.abs(currentPrice - liquidationPrice) / currentPrice;
    if (distance >= 0.2) return 'safe' // >20% away
    ;
    if (distance >= 0.1) return 'warning' // >10% away
    ;
    return 'danger' // <10% away
    ;
}
function getPositionPnLRisk(pnlPercentage) {
    if (pnlPercentage >= 0) return 'safe';
    if (pnlPercentage >= -10) return 'warning';
    return 'danger';
}
;
}),
"[project]/frontend/src/components/ui/section-header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SectionHeader",
    ()=>SectionHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
;
function SectionHeader({ title, href, icon, linkText = "View All →", className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex items-center justify-between mb-3", className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-7 h-7 rounded-lg bg-goodgreen/10 border border-goodgreen/15 flex items-center justify-center text-goodgreen",
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/section-header.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold text-white",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/section-header.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/section-header.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                href: href,
                className: "text-xs text-goodgreen hover:text-goodgreen/80 transition-colors",
                children: linkText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/section-header.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/section-header.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Skeleton",
    ()=>Skeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('animate-pulse rounded-md bg-muted', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/skeleton.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/frontend/src/components/ui/summary-card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SummaryCard",
    ()=>SummaryCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
;
;
function SummaryCard({ label, value, color, className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5", className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/summary-card.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-lg sm:text-xl font-bold", color ?? 'text-white'),
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/summary-card.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/summary-card.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/tabs.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tabs",
    ()=>Tabs,
    "TabsContent",
    ()=>TabsContent,
    "TabsList",
    ()=>TabsList,
    "TabsTrigger",
    ()=>TabsTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tabs/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const Tabs = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const TabsList = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["List"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/tabs.tsx",
        lineNumber: 13,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
TabsList.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["List"].displayName;
const TabsTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium', 'ring-offset-background transition-all', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'disabled:pointer-events-none disabled:opacity-50', 'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/tabs.tsx",
        lineNumber: 28,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
TabsTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"].displayName;
const TabsContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('mt-2 ring-offset-background', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/tabs.tsx",
        lineNumber: 47,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
TabsContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
;
}),
"[project]/frontend/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip,
    "TooltipContent",
    ()=>TooltipContent,
    "TooltipProvider",
    ()=>TooltipProvider,
    "TooltipTrigger",
    ()=>TooltipTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const TooltipProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"];
const Tooltip = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const TooltipTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"];
const TooltipContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('z-50 overflow-hidden rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-md', 'animate-in fade-in-0 zoom-in-95', 'data-[side=bottom]:slide-in-from-top-2', 'data-[side=left]:slide-in-from-right-2', 'data-[side=right]:slide-in-from-left-2', 'data-[side=top]:slide-in-from-bottom-2', className),
            ...props
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/tooltip.tsx",
            lineNumber: 16,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/tooltip.tsx",
        lineNumber: 15,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
TooltipContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
;
}),
"[project]/frontend/src/components/ui/transaction-progress.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapTransactionProgress",
    ()=>SwapTransactionProgress,
    "TransactionProgress",
    ()=>TransactionProgress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const statusIcons = {
    pending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"],
    in_progress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"],
    completed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"],
    failed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"],
    skipped: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"]
};
const statusColors = {
    pending: 'text-gray-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    skipped: 'text-yellow-400'
};
const statusBorderColors = {
    pending: 'border-gray-400',
    in_progress: 'border-blue-400',
    completed: 'border-green-400',
    failed: 'border-red-400',
    skipped: 'border-yellow-400'
};
function TransactionProgress({ steps, currentStepId, onRetry, onSkip, className }) {
    const currentStepIndex = currentStepId ? steps.findIndex((step)=>step.id === currentStepId) : -1;
    const completedSteps = steps.filter((step)=>step.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = completedSteps / totalSteps * 100;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('space-y-4', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full h-2 bg-gray-700 rounded-full overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                            className: "h-full bg-gradient-to-r from-goodgreen to-green-400",
                            initial: {
                                width: 0
                            },
                            animate: {
                                width: `${progressPercentage}%`
                            },
                            transition: {
                                duration: 0.5,
                                ease: 'easeOut'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center mt-2 text-xs text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    completedSteps,
                                    " of ",
                                    totalSteps,
                                    " completed"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    Math.round(progressPercentage),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: steps.map((step, index)=>{
                    const Icon = statusIcons[step.status];
                    const isActive = step.id === currentStepId;
                    const isPastStep = index < currentStepIndex;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-start gap-3 p-3 rounded-lg border transition-colors', isActive ? 'bg-blue-500/10 border-blue-500/30' : step.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : step.status === 'failed' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-700/30'),
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: index * 0.1
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5', statusBorderColors[step.status]),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('w-3 h-3', statusColors[step.status], step.status === 'in_progress' && 'animate-spin')
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                    lineNumber: 114,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                lineNumber: 108,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium', isActive ? 'text-white' : 'text-gray-300'),
                                                        children: step.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                        lineNumber: 127,
                                                        columnNumber: 21
                                                    }, this),
                                                    step.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-400 mt-1",
                                                        children: step.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                        lineNumber: 134,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                lineNumber: 126,
                                                columnNumber: 19
                                            }, this),
                                            step.gasEstimate && step.status !== 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-right",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-400",
                                                        children: "Est. Gas"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                        lineNumber: 143,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-mono text-gray-300",
                                                        children: step.gasEstimate
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                        lineNumber: 144,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                lineNumber: 142,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                        lineNumber: 125,
                                        columnNumber: 17
                                    }, this),
                                    step.txHash && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: `https://etherscan.io/tx/${step.txHash}`,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            className: "text-xs text-blue-400 hover:text-blue-300 font-mono break-all",
                                            children: step.txHash
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                            lineNumber: 154,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                        lineNumber: 153,
                                        columnNumber: 19
                                    }, this),
                                    step.status === 'failed' && step.errorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-red-400",
                                            children: step.errorMessage
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                            lineNumber: 168,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                        lineNumber: 167,
                                        columnNumber: 19
                                    }, this),
                                    step.estimatedTime && step.status === 'in_progress' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-400",
                                            children: [
                                                "Est. ",
                                                step.estimatedTime,
                                                "s remaining"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                            lineNumber: 175,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                        lineNumber: 174,
                                        columnNumber: 19
                                    }, this),
                                    step.status === 'failed' && (onRetry || onSkip) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 mt-3",
                                        children: [
                                            onRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>onRetry(step.id),
                                                className: "px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
                                                children: "Retry"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                lineNumber: 185,
                                                columnNumber: 23
                                            }, this),
                                            onSkip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>onSkip(step.id),
                                                className: "px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors",
                                                children: "Skip"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                                lineNumber: 193,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                        lineNumber: 183,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                                lineNumber: 124,
                                columnNumber: 15
                            }, this)
                        ]
                    }, step.id, true, {
                        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                        lineNumber: 91,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: completedSteps === totalSteps && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        scale: 0.9
                    },
                    animate: {
                        opacity: 1,
                        scale: 1
                    },
                    className: "p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                            className: "w-6 h-6 text-green-400 mx-auto mb-2"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                            lineNumber: 216,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-green-400 font-medium",
                            children: "All transactions completed successfully!"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                            lineNumber: 217,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                    lineNumber: 211,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                lineNumber: 209,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: steps.some((step)=>step.status === 'failed') && completedSteps < totalSteps && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        scale: 0.9
                    },
                    animate: {
                        opacity: 1,
                        scale: 1
                    },
                    className: "p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            className: "w-6 h-6 text-red-400 mx-auto mb-2"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                            lineNumber: 232,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-red-400 font-medium",
                            children: "Transaction failed. Please retry or contact support."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                            lineNumber: 233,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                    lineNumber: 227,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
function SwapTransactionProgress({ approveStatus, swapStatus, onRetryApprove, onRetrySwap, className }) {
    const steps = [
        {
            id: 'approve',
            label: 'Token Approval',
            description: 'Approve spending of input token',
            status: approveStatus || 'pending',
            gasEstimate: '0.003 ETH'
        },
        {
            id: 'swap',
            label: 'Execute Swap',
            description: 'Complete the token exchange',
            status: swapStatus || 'pending',
            gasEstimate: '0.015 ETH'
        }
    ];
    const handleRetry = (stepId)=>{
        if (stepId === 'approve' && onRetryApprove) {
            onRetryApprove();
        } else if (stepId === 'swap' && onRetrySwap) {
            onRetrySwap();
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TransactionProgress, {
        steps: steps,
        onRetry: handleRetry,
        className: className
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/transaction-progress.tsx",
        lineNumber: 283,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/ui/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/amount-input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/animated-number.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/badge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$calculator$2d$overlay$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/calculator-overlay.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/dialog.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/dropdown-menu.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/empty-state.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$enhanced$2d$animated$2d$number$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/enhanced-animated-number.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$gesture$2d$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/gesture-button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/percentage-change.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/price-display.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$risk$2d$indicator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/risk-indicator.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/section-header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$summary$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/summary-card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/tabs.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/toast.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$transaction$2d$progress$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/transaction-progress.tsx [app-ssr] (ecmascript)");
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
;
}),
"[project]/frontend/src/lib/priceSource.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/frontend/src/components/PriceSourceBadge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceSourceBadge",
    ()=>PriceSourceBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-ssr] (ecmascript)");
'use client';
;
;
function PriceSourceBadge({ source, size = 'md', className = '' }) {
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["priceSourceLabel"])(source);
    const variant = VARIANTS[source];
    const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "price-source-badge",
        "data-source": source,
        "aria-label": `Price source: ${label}`,
        className: `inline-flex items-center ${gap} ${textSize} ${variant.textClass} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "price-source-dot",
                "aria-hidden": "true",
                className: `${dotSize} rounded-full ${variant.dotClass} ${variant.animateClass ?? ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
}),
"[project]/frontend/src/components/LivePriceCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceCard",
    ()=>LivePriceCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-ssr] (ecmascript)");
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "live-price-card",
        className: `flex flex-col ${compact ? 'p-2.5' : 'p-3'} min-w-[120px] rounded-xl bg-dark-100/70 border border-gray-700/30 ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300",
                        children: symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    showWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        "data-testid": "live-price-warning",
                        "aria-label": source === 'closed' ? 'Market closed' : 'Stale price',
                        className: "size-3.5 text-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price",
                className: `font-semibold ${compact ? 'text-sm' : 'text-base'} ${isFallback ? 'text-gray-500 opacity-70' : 'text-white'}`,
                ...isFallback ? {
                    'data-testid-fallback': ''
                } : {},
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "data-testid": isFallback ? 'fallback-price' : undefined,
                    children: formatPrice(price)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            !compact && change24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-change",
                className: `text-[11px] mt-0.5 ${changeColor}`,
                children: changeText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                        source: source,
                        size: "sm"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] text-gray-500 shrink-0",
                        children: [
                            "Updated ",
                            formatAge(updatedAgoMs)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/LivePriceStrip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceStrip",
    ()=>LivePriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceCard.tsx [app-ssr] (ecmascript)");
'use client';
;
;
const DEFAULT_EMPTY_MESSAGE = 'No positions yet — connect a wallet to track live prices for the stocks and crypto you hold.';
function LivePriceStrip({ entries, compact = false, className = '', title, loading = false, emptyMessage = DEFAULT_EMPTY_MESSAGE }) {
    const isEmpty = entries.length === 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full ${className}`,
        children: [
            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xs uppercase tracking-wider text-gray-500 mb-2 px-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-strip",
                className: "flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide",
                children: [
                    isEmpty && loading && Array.from({
                        length: 3
                    }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            "data-testid": "live-price-skeleton",
                            className: "min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse",
                            "aria-hidden": "true"
                        }, `skeleton-${i}`, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this)),
                    isEmpty && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "live-price-empty",
                        role: "status",
                        className: "flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 px-3 py-3 text-xs text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "inline-block w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    !isEmpty && entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LivePriceCard"], {
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
}),
"[project]/frontend/src/lib/useStockPrices.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStockPrice",
    ()=>getStockPrice,
    "useStockPrices",
    ()=>useStockPrices
]);
/**
 * useStockPrices — live USD prices for GoodStocks synthetic equities.
 *
 * Data source priority:
 *   1. On-chain PriceOracle contract (when StocksPriceOracle is deployed)
 *      Reads all ticker prices in a single multicall via wagmi useReadContracts.
 *   2. Static fallback prices from stockData.ts
 *
 * Prices are returned as plain JavaScript numbers (dollars, NOT 8-decimal bigint).
 * The on-chain oracle returns 8-decimal integers — we convert via / 1e8.
 *
 * Refresh: on-chain data uses wagmi's built-in refetch interval (30s).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
// ─── Static fallback from stockData seeds ────────────────────────────────────
function buildFallbackPrices() {
    const out = {};
    for (const ticker of (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllTickers"])()){
        const stock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStockByTicker"])(ticker);
        if (stock) out[ticker] = stock.price;
    }
    return out;
}
const FALLBACK_PRICES = buildFallbackPrices();
function useStockPrices() {
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllTickers"])(), []);
    // Build a wagmi multicall for every ticker when the oracle is available.
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!oracleAddress) return [];
        return tickers.map((ticker)=>({
                address: oracleAddress,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                functionName: 'getPrice',
                args: [
                    ticker
                ]
            }));
    }, [
        oracleAddress,
        tickers
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const { prices, sources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data || data.length === 0) {
            const fbSources = {};
            for (const t of tickers)fbSources[t] = 'fallback';
            return {
                prices: FALLBACK_PRICES,
                sources: fbSources
            };
        }
        const outPrices = {
            ...FALLBACK_PRICES
        };
        const outSources = {};
        let anyLive = false;
        for(let i = 0; i < tickers.length; i++){
            const result = data[i];
            if (result?.status === 'success' && typeof result.result === 'bigint') {
                // Oracle returns 8-decimal price (e.g. 17872000000 = $178.72)
                outPrices[tickers[i]] = Number(result.result) / 1e8;
                outSources[tickers[i]] = 'chain-oracle';
                anyLive = true;
            } else {
                outSources[tickers[i]] = 'fallback';
            }
        }
        return {
            prices: anyLive ? outPrices : FALLBACK_PRICES,
            sources: outSources
        };
    }, [
        data,
        tickers
    ]);
    const isLive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data || data.length === 0) return false;
        return data.some((r)=>r?.status === 'success');
    }, [
        data
    ]);
    return {
        prices,
        isLive,
        isLoading,
        sources
    };
}
function getStockPrice(prices, ticker) {
    return prices[ticker] ?? FALLBACK_PRICES[ticker] ?? 0;
}
}),
"[project]/frontend/src/lib/usePriceServiceStatus.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__resetPriceServiceStatusStoreForTests",
    ()=>__resetPriceServiceStatusStoreForTests,
    "getDominantSession",
    ()=>getDominantSession,
    "getSessionLabel",
    ()=>getSessionLabel,
    "refreshPriceServiceStatus",
    ()=>refreshPriceServiceStatus,
    "resolvePriceStatusEndpoint",
    ()=>resolvePriceStatusEndpoint,
    "usePriceServiceStatus",
    ()=>usePriceServiceStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
function sanitizeBaseUrl(url) {
    return url.replace(/\/+$/, '');
}
function resolvePriceStatusEndpoint(explicitBaseUrl) {
    const baseUrl = (explicitBaseUrl ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? '').trim();
    if (!baseUrl) return '/api/status/quotes';
    return `${sanitizeBaseUrl(baseUrl)}/status/quotes`;
}
const PRICE_STATUS_ENDPOINT = resolvePriceStatusEndpoint();
const POLL_INTERVAL_MS = 10_000;
const FAILURE_BACKOFF_BASE_MS = 15_000;
const FAILURE_BACKOFF_MAX_MS = 120_000;
const store = {
    state: {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    },
    subscribers: new Set(),
    intervalId: null,
    inFlight: false,
    failureCount: 0,
    cooldownUntil: 0
};
function notify() {
    for (const sub of store.subscribers)sub(store.state);
}
async function fetchStatus(force = false) {
    if (store.inFlight) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!force && Date.now() < store.cooldownUntil) return;
    store.inFlight = true;
    try {
        const res = await fetch(PRICE_STATUS_ENDPOINT, {
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`);
        const data = await res.json();
        store.failureCount = 0;
        store.cooldownUntil = 0;
        store.state = {
            status: data,
            isLoading: false,
            error: null,
            nextRetryAt: null
        };
    } catch (err) {
        store.failureCount += 1;
        const backoffMs = Math.min(FAILURE_BACKOFF_MAX_MS, FAILURE_BACKOFF_BASE_MS * 2 ** Math.max(0, store.failureCount - 1));
        store.cooldownUntil = Date.now() + backoffMs;
        store.state = {
            ...store.state,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Oracle status unavailable',
            nextRetryAt: store.cooldownUntil
        };
    } finally{
        store.inFlight = false;
        notify();
    }
}
function startPolling() {
    if (store.intervalId !== null) return;
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function stopPolling() {
    if (store.subscribers.size > 0) return;
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
    }
}
function usePriceServiceStatus() {
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(store.state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const subscriber = (next)=>setSnapshot(next);
        store.subscribers.add(subscriber);
        startPolling();
        if (!store.state.status && !store.inFlight) {
            void fetchStatus();
        } else {
            setSnapshot(store.state);
        }
        return ()=>{
            store.subscribers.delete(subscriber);
            stopPolling();
        };
    }, []);
    return snapshot;
}
function getSessionLabel(state) {
    switch(state){
        case 'open':
            return 'Market Open';
        case 'pre-market':
            return 'Pre-Market';
        case 'after-hours':
            return 'After Hours';
        case 'closed':
            return 'Market Closed';
        case 'halted':
            return 'Halted';
        default:
            return 'Unknown';
    }
}
async function refreshPriceServiceStatus(force = true) {
    await fetchStatus(force);
}
function getDominantSession(quotes) {
    if (quotes.length === 0) return 'unknown';
    const counts = new Map();
    for (const q of quotes){
        counts.set(q.sessionState, (counts.get(q.sessionState) ?? 0) + 1);
    }
    let max = 0;
    let dominant = 'unknown';
    for (const [state, count] of counts){
        if (count > max) {
            max = count;
            dominant = state;
        }
    }
    return dominant;
}
function __resetPriceServiceStatusStoreForTests() {
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
    }
    store.state = {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    };
    store.subscribers.clear();
    store.intervalId = null;
    store.inFlight = false;
    store.failureCount = 0;
    store.cooldownUntil = 0;
}
}),
"[project]/frontend/src/components/PortfolioPriceStrip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PortfolioPriceStrip",
    ()=>PortfolioPriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceStrip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockPrices.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function PortfolioPriceStrip({ stockTickers, cryptoSymbols, className = '' }) {
    const stockTickersDedup = Array.from(new Set(stockTickers));
    const cryptoDedup = Array.from(new Set(cryptoSymbols));
    const { prices: cryptoPrices, sources: cryptoSources, quotes, lastUpdated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePriceFeeds"])(cryptoDedup);
    const { prices: stockPrices, sources: stockSources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStockPrices"])();
    const { status } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>Date.now());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const id = setInterval(()=>setNow(Date.now()), 1000);
        return ()=>clearInterval(id);
    }, []);
    const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null;
    const entries = [];
    for (const ticker of stockTickersDedup){
        const baseSource = stockSources[ticker] ?? 'fallback';
        const sq = status?.quotes.find((q)=>q.symbol === ticker);
        // Stocks-specific override: when sessionState says closed/halted, show it
        // even if the chain oracle has a last price. Stale → respect freshness.
        let finalSource = baseSource;
        if (sq) {
            if (sq.sessionState === 'closed' || sq.sessionState === 'halted') {
                finalSource = 'closed';
            } else if (sq.lastUpdateMs > 60_000) {
                // Only downgrade chain to stale; if it was already fallback, keep it.
                finalSource = baseSource === 'chain-oracle' ? 'stale' : baseSource;
            } else if (baseSource !== 'chain-oracle') {
                finalSource = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolvePriceSource"])({
                    chainOk: false,
                    statusQuote: {
                        lastUpdateMs: sq.lastUpdateMs,
                        sessionState: sq.sessionState
                    },
                    hasFallback: true
                });
            }
        }
        entries.push({
            symbol: ticker,
            price: stockPrices[ticker] ?? 0,
            change24h: null,
            source: finalSource,
            updatedAgoMs
        });
    }
    for (const sym of cryptoDedup){
        entries.push({
            symbol: sym,
            price: cryptoPrices[sym] ?? 0,
            change24h: quotes[sym]?.change24h ?? null,
            source: cryptoSources[sym] ?? 'unknown',
            updatedAgoMs
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LivePriceStrip"], {
        entries: entries,
        className: className
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PortfolioPriceStrip.tsx",
        lineNumber: 89,
        columnNumber: 10
    }, this);
}
}),
"[project]/frontend/src/app/(app)/portfolio/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PortfolioPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPredict$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainPredict.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainStocks.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainPerps.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$portfolioLendYieldData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/portfolioLendYieldData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConnectWalletEmptyState$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ConnectWalletEmptyState.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConnectWalletBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ConnectWalletBanner.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PortfolioOnChain$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PortfolioOnChain.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$Sparkline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/Sparkline.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/stock-logo.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$summary$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/summary-card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/section-header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/empty-state.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PortfolioPriceStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PortfolioPriceStrip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockPrices.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-ssr] (ecmascript)");
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
function HealthBadge({ value }) {
    const color = value >= 2.5 ? 'bg-green-500' : value >= 1.5 ? 'bg-yellow-500' : 'bg-red-500';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "flex items-center gap-1 text-xs text-gray-400",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `w-1.5 h-1.5 rounded-full ${color}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            value.toFixed(1)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
function PortfolioPage() {
    const { holdings: stockHoldings } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainHoldings"])();
    const { positions: predictPositions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPredict$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainPredictPositions"])();
    const predictSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPredict$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainPredictSummary"])();
    const { markets: predictMarkets } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPredict$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainMarkets"])();
    const { positions: perpsPositions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainPositions"])();
    const { summary: perpsAccount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOnChainAccountSummary"])();
    const lend = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$portfolioLendYieldData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMockLendPositions"])();
    const yield_ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$portfolioLendYieldData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMockYieldPositions"])();
    const { sources: stockSources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStockPrices"])();
    const { status: priceStatus } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    // Resolve per-row source for the stocks panel — overlay session state
    // from price-service status on the chain-oracle reading from useStockPrices.
    const resolveStockSource = (ticker)=>{
        const base = stockSources[ticker] ?? 'fallback';
        const sq = priceStatus?.quotes.find((q)=>q.symbol === ticker);
        if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) return 'closed';
        if (sq && sq.lastUpdateMs > 60_000 && base === 'chain-oracle') return 'stale';
        return base;
    };
    // Stocks tickers the user currently holds — strip header.
    const stockTickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>stockHoldings.map((h)=>h.ticker), [
        stockHoldings
    ]);
    // Perp underlyings (e.g. BTC-USD → BTC). Used for the crypto cards.
    const cryptoSymbols = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const set = new Set();
        for (const pos of perpsPositions){
            const base = pos.pair.split('-')[0];
            if (base) set.add(base);
        }
        return Array.from(set);
    }, [
        perpsPositions
    ]);
    // Build predict market lookup
    const predictMarketMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const m = new Map();
        for (const market of predictMarkets){
            m.set(market.id, {
                question: market.question,
                yesPrice: market.yesPrice
            });
        }
        return m;
    }, [
        predictMarkets
    ]);
    // Compute stock summary from on-chain holdings
    const stockSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const totalValue = stockHoldings.reduce((sum, h)=>sum + h.shares * h.currentPrice, 0);
        const totalCost = stockHoldings.reduce((sum, h)=>sum + h.shares * h.avgCost, 0);
        return {
            totalValue,
            unrealizedPnl: totalValue - totalCost
        };
    }, [
        stockHoldings
    ]);
    const totalPerpsPnl = perpsPositions.reduce((sum, p)=>sum + p.unrealizedPnl, 0);
    const totalValue = stockSummary.totalValue + predictSummary.currentValue + perpsAccount.equity + lend.netValue + yield_.totalCurrentValue;
    const totalPnl = stockSummary.unrealizedPnl + predictSummary.unrealizedPnl + totalPerpsPnl + yield_.totalYieldEarned;
    const totalPositions = stockHoldings.length + predictPositions.length + perpsPositions.length + lend.supplies.length + lend.borrows.length + yield_.vaults.length;
    const pnlColor = totalPnl >= 0 ? 'text-green-400' : 'text-red-400';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConnectWalletEmptyState$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConnectWalletEmptyState"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-5xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-2xl font-bold text-white mb-6",
                    children: "Portfolio Overview"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 97,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PortfolioPriceStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortfolioPriceStrip"], {
                        stockTickers: stockTickers,
                        cryptoSymbols: cryptoSymbols
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 100,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ConnectWalletBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConnectWalletBanner"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 106,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PortfolioOnChain$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortfolioOnChain"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 109,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$summary$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCard"], {
                            label: "Total Value",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatLargeNumber"])(totalValue)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 112,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$summary$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCard"], {
                            label: "Unrealized P&L",
                            value: `${totalPnl >= 0 ? '+' : ''}${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(totalPnl)}`,
                            color: pnlColor
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 113,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$summary$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCard"], {
                            label: "Active Positions",
                            value: String(totalPositions)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 118,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 111,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionHeader"], {
                            title: "Stocks",
                            href: "/stocks/portfolio",
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 127,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 123,
                            columnNumber: 9
                        }, this),
                        stockHoldings.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 136,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 135,
                                columnNumber: 15
                            }, this),
                            title: "No stock holdings yet",
                            description: "Buy synthetic stocks like sAAPL or sTSLA to start tracking them here.",
                            action: {
                                label: 'Browse stocks',
                                href: '/stocks'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 133,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                stockHoldings.slice(0, 3).map((h)=>{
                                    const stockName = null // on-chain doesn't store display names
                                    ;
                                    const value = h.shares * h.currentPrice;
                                    const pnl = value - h.shares * h.avgCost;
                                    // Get stock data for sparkline - derive P&L sparkline from price history
                                    const stockData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStockByTicker"])(h.ticker);
                                    const pnlSparkline = stockData?.sparkline7d?.map((price)=>h.shares * (price - h.avgCost)) || [];
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/stocks/${h.ticker}`,
                                        className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StockLogo"], {
                                                        ticker: h.ticker,
                                                        size: "sm"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 159,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-col",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium text-white",
                                                                children: [
                                                                    h.ticker,
                                                                    stockName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-500 ml-1.5",
                                                                        children: stockName
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 163,
                                                                        columnNumber: 39
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 161,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                                                source: resolveStockSource(h.ticker),
                                                                size: "sm"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 165,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 160,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 158,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    pnlSparkline.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "hidden sm:block",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$Sparkline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sparkline"], {
                                                            data: pnlSparkline,
                                                            positive: pnl >= 0,
                                                            width: 60,
                                                            height: 24
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                            lineNumber: 171,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 170,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-white",
                                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(value)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 175,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                                children: [
                                                                    pnl >= 0 ? '+' : '',
                                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(pnl)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 176,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 174,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 168,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, h.ticker, true, {
                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                        lineNumber: 157,
                                        columnNumber: 17
                                    }, this);
                                }),
                                stockHoldings.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-500 text-center pt-1",
                                    children: [
                                        "+",
                                        stockHoldings.length - 3,
                                        " more"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 185,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 144,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 122,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionHeader"], {
                            title: "Predictions",
                            href: "/predict/portfolio",
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 198,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 197,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 193,
                            columnNumber: 9
                        }, this),
                        predictPositions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 206,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 205,
                                columnNumber: 15
                            }, this),
                            title: "No prediction positions yet",
                            description: "Take a YES or NO position on a market to back your forecast.",
                            action: {
                                label: 'Browse markets',
                                href: '/predict'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 203,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                predictPositions.slice(0, 3).map((pos)=>{
                                    const market = predictMarketMap.get(pos.marketId);
                                    const currentVal = pos.side === 'yes' ? pos.currentPrice : 1 - pos.currentPrice;
                                    const pnl = pos.shares * (currentVal - pos.avgPrice);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/predict/${pos.marketId}`,
                                        className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 min-w-0 mr-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-white truncate",
                                                        children: market?.question ?? `Market #${pos.marketId}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 222,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 mt-0.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `text-[10px] font-medium px-1.5 py-0.5 rounded ${pos.side === 'yes' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`,
                                                                children: pos.side.toUpperCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 224,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs text-gray-500",
                                                                children: [
                                                                    pos.shares.toFixed(1),
                                                                    " shares"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 227,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 223,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 221,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium shrink-0 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                children: [
                                                    pnl >= 0 ? '+' : '',
                                                    "$",
                                                    pnl.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 230,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, pos.marketId, true, {
                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                        lineNumber: 220,
                                        columnNumber: 17
                                    }, this);
                                }),
                                predictPositions.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-500 text-center pt-1",
                                    children: [
                                        "+",
                                        predictPositions.length - 3,
                                        " more"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 237,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 214,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 192,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionHeader"], {
                            title: "Perpetual Futures",
                            href: "/perps/portfolio",
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 249,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 245,
                            columnNumber: 9
                        }, this),
                        perpsPositions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 258,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 257,
                                columnNumber: 15
                            }, this),
                            title: "No open perps positions",
                            description: "Open a long or short with leverage on BTC, ETH and more.",
                            action: {
                                label: 'Open a position',
                                href: '/perps'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 255,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                perpsPositions.slice(0, 3).map((pos, i)=>{
                                    const baseAsset = pos.pair.split('-')[0];
                                    const sq = priceStatus?.quotes.find((q)=>q.symbol === baseAsset);
                                    const cryptoSrc = sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted') ? 'closed' : pos.markPrice > 0 ? 'chain-oracle' : 'fallback';
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/perps/portfolio",
                                        className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-medium text-white",
                                                        children: pos.pair
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[10px] font-semibold px-1.5 py-0.5 rounded ${pos.side === 'long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`,
                                                        children: [
                                                            pos.side.toUpperCase(),
                                                            " ",
                                                            pos.leverage,
                                                            "x"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                                        source: cryptoSrc,
                                                        size: "sm"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 275,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-right",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `text-sm font-medium ${pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                        children: [
                                                            pos.unrealizedPnl >= 0 ? '+' : '',
                                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pos.unrealizedPnl)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 283,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-gray-500",
                                                        children: [
                                                            "Size ",
                                                            pos.size
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 286,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 282,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, `${pos.pair}-${i}`, true, {
                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                        lineNumber: 274,
                                        columnNumber: 17
                                    }, this);
                                }),
                                perpsPositions.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-500 text-center pt-1",
                                    children: [
                                        "+",
                                        perpsPositions.length - 3,
                                        " more"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 292,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 266,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 244,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionHeader"], {
                            title: "GoodLend",
                            href: "/lend/portfolio",
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M3 10h18M3 14h18M3 6h18M3 18h18M8 6v12M16 6v12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 305,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 304,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 300,
                            columnNumber: 9
                        }, this),
                        lend.supplies.length === 0 && lend.borrows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M3 10h18M3 14h18M3 6h18M3 18h18M8 6v12M16 6v12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 313,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 312,
                                columnNumber: 15
                            }, this),
                            title: "No lending positions",
                            description: "Supply collateral to earn yield or borrow against your assets.",
                            action: {
                                label: 'Start lending',
                                href: '/lend'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 310,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                lend.supplies.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] font-medium text-gray-500 uppercase tracking-wider px-3 pt-1",
                                            children: "Supplied"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 324,
                                            columnNumber: 17
                                        }, this),
                                        lend.supplies.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/lend/portfolio",
                                                className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-400",
                                                                children: s.asset.replace('g', '').slice(0, 2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 328,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-sm font-medium text-white",
                                                                        children: s.asset
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 332,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-500 ml-1.5",
                                                                        children: [
                                                                            s.amount.toLocaleString(),
                                                                            " supplied"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 333,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 331,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 327,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(HealthBadge, {
                                                                value: s.healthFactor
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 337,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-right",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-sm text-white",
                                                                        children: [
                                                                            "$",
                                                                            s.valueUsd.toLocaleString(undefined, {
                                                                                minimumFractionDigits: 2
                                                                            })
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 339,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-green-400",
                                                                        children: [
                                                                            s.apy.toFixed(1),
                                                                            "% APY"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 340,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 338,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 336,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, `supply-${s.asset}`, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 326,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true),
                                lend.borrows.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] font-medium text-gray-500 uppercase tracking-wider px-3 pt-2",
                                            children: "Borrowed"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 349,
                                            columnNumber: 17
                                        }, this),
                                        lend.borrows.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/lend/portfolio",
                                                className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[8px] font-bold text-orange-400",
                                                                children: b.asset.replace('g', '').slice(0, 2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 353,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-sm font-medium text-white",
                                                                        children: b.asset
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 357,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-500 ml-1.5",
                                                                        children: [
                                                                            b.amount.toLocaleString(),
                                                                            " borrowed"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                        lineNumber: 358,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 356,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 352,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-white",
                                                                children: [
                                                                    "-$",
                                                                    b.valueUsd.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2
                                                                    })
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 362,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-red-400",
                                                                children: [
                                                                    b.rate.toFixed(1),
                                                                    "% rate"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 363,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 361,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, `borrow-${b.asset}`, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 351,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between pt-2 px-3 border-t border-gray-700/20 mt-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: "Net Lending Value"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 370,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium text-white",
                                            children: [
                                                "$",
                                                lend.netValue.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2
                                                })
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 371,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 369,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 321,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 299,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$section$2d$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionHeader"], {
                            title: "GoodYield",
                            href: "/yield/portfolio",
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 384,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 383,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 379,
                            columnNumber: 9
                        }, this),
                        yield_.vaults.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 392,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                lineNumber: 391,
                                columnNumber: 15
                            }, this),
                            title: "No yield positions",
                            description: "Deposit into vaults to earn yield on your assets.",
                            action: {
                                label: 'Browse vaults',
                                href: '/yield'
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 389,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                yield_.vaults.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/yield/portfolio",
                                        className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[8px] font-bold text-purple-400",
                                                        children: v.asset.slice(0, 2)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 404,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium text-white",
                                                                children: v.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 408,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs text-gray-500 ml-1.5",
                                                                children: v.asset
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 409,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 407,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 403,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400",
                                                        children: [
                                                            v.apy.toFixed(1),
                                                            "% APY"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 413,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-white",
                                                                children: [
                                                                    "$",
                                                                    v.currentValue.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2
                                                                    })
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 417,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `text-xs ${v.yieldEarned >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                                children: [
                                                                    "+$",
                                                                    v.yieldEarned.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2
                                                                    })
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                        lineNumber: 416,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                                lineNumber: 412,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, v.name, true, {
                                        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                        lineNumber: 402,
                                        columnNumber: 15
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between pt-2 px-3 border-t border-gray-700/20 mt-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: "Total Yield Earned"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 426,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium text-green-400",
                                            children: [
                                                "+$",
                                                yield_.totalYieldEarned.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2
                                                })
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                            lineNumber: 427,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                                    lineNumber: 425,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                            lineNumber: 400,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
                    lineNumber: 378,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
            lineNumber: 96,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/portfolio/page.tsx",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0qgffrj._.js.map